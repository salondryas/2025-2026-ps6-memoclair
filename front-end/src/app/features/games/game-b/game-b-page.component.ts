import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LargeAudioControlsComponent } from '../../../shared/components/games/large-audio-controls/large-audio-controls.component';
import { GameHeaderComponent } from '../../../shared/components/game-header/game-header.component';
import { MascotDecoratorComponent } from '../../../shared/components/mascot-decorator/mascot-decorator.component';
import { ChoiceCardComponent } from '../../../shared/components/choice-card/choice-card.component';
import { GuideMascotComponent } from '../../../shared/components/guide-mascot/guide-mascot.component';

import { environment } from '../../../../environments/environment';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { StatisticsService } from '../../caregiver/services/statistics.service';
import { EmotionalState, GameBGenerateErrorDto, GameBGenerateRequestDto, GameBGenerateResponseDto, GameBQuestionDto, SupportLevel } from '../../../models/session.model';
import { SessionSummaryService } from '../services/session-summary.service';
import { SoundEffectsService } from '../../../core/services/sound-effects.service';
import { GameBFlowService } from '../services/game-b-flow.service';

import { CaregiverProfileService } from '../../caregiver/services/caregiver-profile.service';
import { PatientProfile } from '../../../models/patient.model';
import { GAME_B_QUESTIONS } from './game-b-questions';
import { TtsService } from '../../../core/services/tts.service';
import { AudioHelpButtonComponent } from '../../../shared/components/audio-help-button/audio-help-button.component';

@Component({
  selector: 'app-game-b-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LargeAudioControlsComponent,
    GameHeaderComponent,
    MascotDecoratorComponent,
    ChoiceCardComponent,
    GuideMascotComponent,
    AudioHelpButtonComponent,
  ],
  templateUrl: './game-b-page.component.html',
  styleUrls: ['./game-b-page.component.scss'],
})
export class GameBPageComponent implements OnInit, OnDestroy {
  patientName$ = this.patientContext.activePatient$;
  profile!: PatientProfile;

  questions: GameBQuestionDto[] = [...GAME_B_QUESTIONS];

  currentQuestionIndex = 0;
  totalQuestions = 0;

  locked = false;
  finished = false;
  isPaused = false;
  selectedChoiceId: string | null = null;

  feedbackMessage = '';
  hintMessage: string | null = null;
  isAutoRevealed = false;
  autoNextCountdownSeconds: number | null = null;

  private readonly startedAt = new Date().toISOString();
  private hintCount = 0;
  private guidedMoments = 0;
  private skippedCount = 0;
  private wrongAnswers = 0;
  private questionStartTime = Date.now();
  private latencies: number[] = [];

  loading = true;
  isEntering = false;
  private enterTimeoutId: number | null = null;

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly statistics: StatisticsService,
    private readonly sessionSummary: SessionSummaryService,
    private readonly caregiverProfile: CaregiverProfileService,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly soundEffects: SoundEffectsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly tts: TtsService,
    private readonly gameBFlow: GameBFlowService,
  ) {}

  ngOnInit(): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    this.profile = this.caregiverProfile.getProfile(patient.id);

    const payload: GameBGenerateRequestDto = { patientName: patient.firstName };
    this.http.post<GameBGenerateResponseDto>(
      `${environment.backendUrl}/api/game-b/generate/${patient.id}`,
      payload,
    ).subscribe({
      next: ({ questions: geminiQuestions }) => {
        this.ngZone.run(() => {
          this.initializeGame();
          if (geminiQuestions?.length) {
            this.questions = [...this.questions, ...geminiQuestions];
            this.totalQuestions = this.questions.length;
          }
          this.loading = false;
          this.startAssistFlow();
          this.cdr.detectChanges();
        });
      },
      error: (error: HttpErrorResponse) => {
        const apiError = error.error as GameBGenerateErrorDto | null;
        console.error('[GameB] Erreur API generate:', apiError?.error ?? error.message);
        this.ngZone.run(() => {
          this.initializeGame();
          this.loading = false;
          this.startAssistFlow();
          this.cdr.detectChanges();
        });
      },
    });
  }

  private initializeGame(): void {
    const qCount = Number(this.profile.questionCount);
    const aCount = Number(this.profile.answerCount);

    this.questions = this.questions
      .sort(() => Math.random() - 0.5)
      .slice(0, qCount)
      .map(q => {
        const correctChoice = q.choices.find(c => c.isCorrect)!;
        const others = q.choices.filter(c => !c.isCorrect).sort(() => Math.random() - 0.5);
        const limitedOthers = others.slice(0, Math.min(aCount - 1, others.length));
        const finalChoices = [correctChoice, ...limitedOthers].sort(() => Math.random() - 0.5);

        return {
          ...q,
          choices: finalChoices
        };
      });

    this.totalQuestions = this.questions.length;
  }

  ngOnDestroy(): void {
    this.clearAssistFlow();
    if (this.enterTimeoutId) window.clearTimeout(this.enterTimeoutId);
    this.tts.cancel();
    if (!this.finished && this.totalQuestions > 0) {
      this.saveSession(true);
    }
  }

  get currentQuestion(): GameBQuestionDto {
    return this.questions[this.currentQuestionIndex];
  }

  get progressPercent(): number {
    return Math.round(((this.currentQuestionIndex + 1) / this.totalQuestions) * 100);
  }

  get state(): { hint: string | null } {
    return { hint: this.hintMessage };
  }

  onChoose(choiceId: string): void {
    if (this.locked || this.finished) return;
    this.recordLatency();
    this.clearAssistFlow();
    this.locked = true;
    this.selectedChoiceId = choiceId;
    this.hintMessage = null;

    const choice = this.currentQuestion.choices.find((c) => c.id === choiceId);
    if (choice && !choice.isCorrect) this.wrongAnswers++;
    this.soundEffects.play(choice?.isCorrect ? 'success' : 'gentleError');
    this.feedbackMessage = choice?.isCorrect
      ? 'Très bien 🌿'
      : "D'accord, regardons ensemble la bonne réponse 🌿";
    this.startResolutionFlow();
  }

  requestHint(): void {
    if (this.locked || this.finished) return;
    const alreadyShown = !!this.hintMessage;
    this.hintCount++;
    this.soundEffects.play('hint');
    this.hintMessage = this.currentQuestion.hint;
    this.feedbackMessage = 'Prenez votre temps, un repère peut aider.';
    if (this.hintMessage && !alreadyShown) this.tts.speak(this.hintMessage);
    this.cdr.detectChanges();
  }

  onHint(): void {
    this.requestHint();
  }

  skipQuestion(): void {
    if (this.finished) return;
    this.soundEffects.play('transition');
    this.skippedCount++;
    this.recordLatency();
    this.clearAssistFlow();
    this.locked = true;
    this.selectedChoiceId = null;
    this.feedbackMessage = 'Très bien, passons au souvenir suivant.';
    this.startResolutionFlow();
  }

  get readTexts(): string[] {
    if (this.finished) return [];
    return [this.currentQuestion.question, ...this.currentQuestion.choices.map(c => c.label)];
  }

  onNext(): void {
    this.soundEffects.play('transition');
    this.clearAssistFlow();
    this.isAutoRevealed = false;
    this.tts.cancel();

    const nextIndex = this.currentQuestionIndex + 1;
    if (nextIndex >= this.totalQuestions) {
      this.finished = true;
      this.saveSession();
      this.router.navigate(['/games/end']);
      return;
    }

    this.currentQuestionIndex = nextIndex;
    this.locked = false;
    this.selectedChoiceId = null;
    this.feedbackMessage = '';
    this.hintMessage = null;

    this.triggerEnterAnimation();
    this.startAssistFlow();
  }

  onTogglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.gameBFlow.pause();
      return;
    }
    if (!this.finished) this.gameBFlow.resume();
  }

  isCorrectChoice(choiceId: string): boolean {
    if (!this.locked) return false;
    return !!this.currentQuestion.choices.find((c) => c.id === choiceId)?.isCorrect;
  }

  isWrongSelectedChoice(choiceId: string): boolean {
    if (!this.locked || !this.selectedChoiceId) return false;
    const selected = this.currentQuestion.choices.find((c) => c.id === this.selectedChoiceId);
    return choiceId === this.selectedChoiceId && !!selected && !selected.isCorrect;
  }

  isAutoHighlighted(choiceId: string): boolean {
    return this.isAutoRevealed && this.isCorrectChoice(choiceId);
  }

  private startAssistFlow(): void {
    this.clearAssistFlow();
    this.isAutoRevealed = false;
    this.questionStartTime = Date.now();
    const autoNextMode = this.resolveAutoNextMode();
    const hintDelay = this.profile.hintDelaySeconds * 1000;
    const revealDelay = hintDelay + 20000;

    this.gameBFlow.startQuestionFlow({
      hintDelayMs: hintDelay,
      revealDelayMs: revealDelay,
      autoNextMode,
      onHint: () => {
        this.ngZone.run(() => {
          if (this.locked || this.finished || this.isPaused) return;
          this.requestHint();
          this.cdr.detectChanges();
        });
      },
      onAutoReveal: () => {
        this.ngZone.run(() => {
          if (!this.locked && !this.finished && !this.isPaused) {
            this.guidedMoments++;
            this.recordLatency();
            const correct = this.currentQuestion.choices.find((c) => c.isCorrect);
            if (!correct) return;
            this.locked = true;
            this.selectedChoiceId = correct.id;
            this.isAutoRevealed = true;
            this.feedbackMessage = 'Nous vous aidons : voici la bonne réponse ✅';
            this.cdr.detectChanges();
          }
        });
      },
      onAutoNext: () => {
        this.ngZone.run(() => {
          if (!this.finished && !this.isPaused) this.onNext();
        });
      },
      onCountdownTick: (seconds) => {
        this.ngZone.run(() => {
          this.autoNextCountdownSeconds = seconds;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private startResolutionFlow(): void {
    this.gameBFlow.startResolutionFlow({
      autoNextMode: this.resolveAutoNextMode(),
      onAutoNext: () => {
        this.ngZone.run(() => {
          if (!this.finished && !this.isPaused) this.onNext();
        });
      },
      onCountdownTick: (seconds) => {
        this.ngZone.run(() => {
          this.autoNextCountdownSeconds = seconds;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private triggerEnterAnimation(): void {
    if (this.enterTimeoutId) window.clearTimeout(this.enterTimeoutId);
    this.isEntering = false;
    window.setTimeout(() => {
      this.isEntering = true;
      this.enterTimeoutId = window.setTimeout(() => { this.isEntering = false; }, 350);
    }, 0);
  }

  private recordLatency(): void {
    const latency = Math.round((Date.now() - this.questionStartTime) / 1000);
    if (latency > 0) this.latencies.push(latency);
  }

  private computeAvgLatency(): number {
    if (!this.latencies.length) return 0;
    return Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length);
  }

  private computeSupportLevel(): SupportLevel {
    const signals = this.hintCount + this.guidedMoments;
    if (signals <= 1) return 'leger';
    if (signals <= 3) return 'modere';
    return 'important';
  }

  private computeEmotionalState(): EmotionalState {
    if (this.guidedMoments >= 2) return 'variable';
    const avg = this.computeAvgLatency();
    if (avg <= 8) return 'engage';
    if (avg >= 18) return 'fatigue';
    return 'apaise';
  }

  private buildSummary(): string {
    const signals = this.hintCount + this.guidedMoments;
    if (signals === 0) return 'Séance fluide, aucun indice nécessaire. Proposer des souvenirs plus lointains.';
    if (signals <= 2) return 'Quelques indices utilisés. Conserver les supports visuels actuels.';
    return "Plusieurs moments d'accompagnement. Privilégier des photos personnelles et des supports très lisibles.";
  }

  private saveSession(earlyStop = false): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    const duration = Math.max(1, Math.round((Date.now() - Date.parse(this.startedAt)) / 60000));
    const session = this.sessionSummary.build({
      patientId: patient.id,
      gameType: 'game-b',
      startedAt: this.startedAt,
      durationMinutes: duration,
      hintCount: this.hintCount,
      guidedMoments: this.guidedMoments,
      skippedMoments: this.skippedCount,
      wrongAnswers: this.wrongAnswers,
      earlyStop,
      latenciesSeconds: this.latencies,
      supportLevel: this.computeSupportLevel(),
      emotionalState: this.computeEmotionalState(),
      summary: this.buildSummary(),
    });

    this.statistics.recordSession(session);
  }

  private clearAssistFlow(): void {
    this.gameBFlow.clear();
    this.autoNextCountdownSeconds = null;
  }

  private resolveAutoNextMode(): 'manual' | '5s' | '8s' {
    const mode = this.profile.autoNextMode;
    if (mode === 'manual' || mode === '8s') return mode;
    return '5s';
  }

  onImageError(): void {
    console.warn('Failed to load image for question:', this.currentQuestion.id);
  }
}
