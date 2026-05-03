import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LargeAudioControlsComponent } from '../../../shared/components/games/large-audio-controls/large-audio-controls.component';
import { GameHeaderComponent } from '../../../shared/components/game-header/game-header.component';
import { HintBannerComponent } from '../../../shared/components/hint-banner/hint-banner.component';
import { ChoiceCardComponent } from '../../../shared/components/choice-card/choice-card.component';
// 1. IMPORT DE LA NOUVELLE MASCOTTE
import { GuideMascotComponent } from '../../../shared/components/guide-mascot/guide-mascot.component';

import { environment } from '../../../../environments/environment';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { StatisticsService } from '../../caregiver/services/statistics.service';
import { SupportLevel, EmotionalState } from '../../../models/session.model';
import { SessionSummaryService } from '../services/session-summary.service';

import { CaregiverProfileService } from '../../caregiver/services/caregiver-profile.service';
import { PatientProfile } from '../../../models/patient.model';
import { GAME_B_QUESTIONS } from './game-b-questions';

export interface Choice {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  mediaType: 'image' | 'audio';
  imageSrc?: string;
  audioSrc?: string;
  question: string;
  source: string;
  caption: string;
  hint: string;
  choices: Choice[];
}

@Component({
  selector: 'app-game-b-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LargeAudioControlsComponent,
    GameHeaderComponent,
    HintBannerComponent,
    ChoiceCardComponent,
    // 2. AJOUT DE LA MASCOTTE AUX IMPORTS DU COMPOSANT
    GuideMascotComponent
  ],
  templateUrl: './game-b-page.component.html',
  styleUrls: ['./game-b-page.component.scss'],
})
export class GameBPageComponent implements OnInit, OnDestroy {
  patientName$ = this.patientContext.activePatient$;
  profile!: PatientProfile;

  questions: Question[] = [...GAME_B_QUESTIONS];

  currentQuestionIndex = 0;
  totalQuestions = 0;

  locked = false;
  finished = false;
  selectedChoiceId: string | null = null;

  feedbackMessage = '';
  hintMessage: string | null = null;
  isAutoRevealed = false;

  private hintTimeoutId: number | null = null;
  private autoRevealTimeoutId: number | null = null;
  private autoNextTimeoutId: number | null = null;

  private readonly startedAt = new Date().toISOString();
  private hintCount = 0;
  private guidedMoments = 0;
  private skippedCount = 0;
  private wrongAnswers = 0;
  private questionStartTime = Date.now();
  private latencies: number[] = [];

  loading = true;

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly statistics: StatisticsService,
    private readonly sessionSummary: SessionSummaryService,
    private readonly caregiverProfile: CaregiverProfileService,
    private readonly router: Router,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    this.profile = this.caregiverProfile.getProfile(patient.id);

    this.http.post<{ questions: Question[] }>(
      `${environment.backendUrl}/api/game-b/generate/${patient.id}`,
      { patientName: patient.firstName },
    ).subscribe({
      next: ({ questions: geminiQuestions }) => {
        this.initializeGame();
        if (geminiQuestions?.length) {
          this.questions = [...this.questions, ...geminiQuestions];
          this.totalQuestions = this.questions.length;
        }
        this.loading = false;
        this.startAssistFlow();
      },
      error: () => {
        this.initializeGame();
        this.loading = false;
        this.startAssistFlow();
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
    if (!this.finished && this.totalQuestions > 0) {
      this.saveSession(true);
    }
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get progressPercent(): number {
    return Math.round(((this.currentQuestionIndex + 1) / this.totalQuestions) * 100);
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
    this.feedbackMessage = choice?.isCorrect
      ? 'Très bien 🌿'
      : "D'accord, regardons ensemble la bonne réponse 🌿";
  }

  requestHint(): void {
    if (this.locked || this.finished) return;
    this.hintCount++;
    this.hintMessage = this.currentQuestion.hint;
    this.feedbackMessage = 'Prenez votre temps, un repère peut aider.';
  }

  skipQuestion(): void {
    if (this.finished) return;
    this.skippedCount++;
    this.recordLatency();
    this.clearAssistFlow();
    this.locked = true;
    this.selectedChoiceId = null;
    this.feedbackMessage = 'Très bien, passons au souvenir suivant.';
  }

  onReadQuestion(): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(this.currentQuestion.question);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  onNext(): void {
    this.clearAssistFlow();
    this.isAutoRevealed = false;

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

    this.startAssistFlow();
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

    const hintDelay = this.profile.hintDelaySeconds * 1000;
    const revealDelay = hintDelay + 20000;
    const nextDelay = revealDelay + 5000;

    this.hintTimeoutId = window.setTimeout(() => {
      if (!this.locked && !this.finished) {
        this.hintCount++;
        this.hintMessage = this.currentQuestion.hint;
        this.feedbackMessage = '💡 Indice automatique affiché.';
      }
    }, hintDelay);

    this.autoRevealTimeoutId = window.setTimeout(() => {
      if (!this.locked && !this.finished) {
        this.guidedMoments++;
        this.recordLatency();
        const correct = this.currentQuestion.choices.find((c) => c.isCorrect);
        if (!correct) return;
        this.locked = true;
        this.selectedChoiceId = correct.id;
        this.isAutoRevealed = true;
        this.feedbackMessage = 'Nous vous aidons : voici la bonne réponse ✅';
      }
    }, revealDelay);

    this.autoNextTimeoutId = window.setTimeout(() => {
      if (!this.finished) this.onNext();
    }, nextDelay);
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
    if (this.hintTimeoutId) window.clearTimeout(this.hintTimeoutId);
    if (this.autoRevealTimeoutId) window.clearTimeout(this.autoRevealTimeoutId);
    if (this.autoNextTimeoutId) window.clearTimeout(this.autoNextTimeoutId);
    this.hintTimeoutId = null;
    this.autoRevealTimeoutId = null;
    this.autoNextTimeoutId = null;
  }
}
