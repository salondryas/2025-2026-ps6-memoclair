import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { StatisticsService } from '../../caregiver/services/statistics.service';
import { GameASessionService, GameAState, GameAQuestion, GameAChoice, GameAStep } from '../services/game-a-session.service';
import { SupportLevel, EmotionalState } from '../../../models/session.model';
import { SessionSummaryService } from '../services/session-summary.service';
import { GameHeaderComponent } from '../../../shared/components/game-header/game-header.component';
import { MascotDecoratorComponent } from '../../../shared/components/mascot-decorator/mascot-decorator.component';
import { ChoiceCardComponent } from '../../../shared/components/choice-card/choice-card.component';
import { SoundEffectsService } from '../../../core/services/sound-effects.service';
import { TtsService } from '../../../core/services/tts.service';
import { AudioHelpButtonComponent } from '../../../shared/components/audio-help-button/audio-help-button.component';

@Component({
  selector: 'app-game-a-page',
  standalone: true,
  imports: [CommonModule, RouterModule, GameHeaderComponent, MascotDecoratorComponent, ChoiceCardComponent, AudioHelpButtonComponent],
  templateUrl: './game-a-page.component.html',
  styleUrls: ['./game-a-page.component.scss']
})
export class GameAPageComponent implements OnInit, OnDestroy {
  readonly HINT_DELAY = 10000;
  readonly AUTO_REVEAL_DELAY = 30000;
  readonly AUTO_NEXT_DELAY = 35000;

  patientName$ = this.patientContext.activePatient$;
  state: GameAState = this.session.createInitialState();
  isPaused = false;
  isTransitioning = false;

  shuffledChoices: GameAChoice[] = [];
  placedSteps: (GameAStep | null)[] = [null, null, null, null];
  availableSteps: GameAStep[] = [];
  readingChoiceId: string | null = null;

  isAutoRevealed = false;
  isEntering = true;
  private navigating = false;
  private enterTimeoutId: number | null = null;
  private hintTimeoutId: number | null = null;
  private autoRevealTimeoutId: number | null = null;
  private autoNextTimeoutId: number | null = null;
  private autoNextQuestionTimeoutId: number | null = null;

  private readonly startedAt = new Date().toISOString();
  private hintCount = 0;
  private guidedMoments = 0;
  private skippedCount = 0;
  private wrongAnswers = 0;
  private questionStartTime = Date.now();
  private latencies: number[] = [];

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly statistics: StatisticsService,
    private readonly sessionSummary: SessionSummaryService,
    private readonly session: GameASessionService,
    private readonly router: Router,
    private readonly soundEffects: SoundEffectsService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef,
    private readonly tts: TtsService,
  ) {}

  ngOnInit(): void {
    const maxQuestions = this.state.profile?.questionCount || 10;
    if (this.state.questions.length > maxQuestions) {
      this.state.questions = this.shuffleArray(this.state.questions).slice(0, maxQuestions);
    }

    this.updateShuffledChoices();
    this.initializeChronoOrder();
    this.startAssistFlow(true);
  }

  private triggerEnterAnimation(): void {
    if (this.enterTimeoutId) window.clearTimeout(this.enterTimeoutId);
    this.isEntering = false;
    window.setTimeout(() => {
      this.isEntering = true;
      this.enterTimeoutId = window.setTimeout(() => { this.isEntering = false; }, 350);
    }, 0);
  }

  ngOnDestroy(): void {
    this.clearAssistFlow();
    if (this.enterTimeoutId) window.clearTimeout(this.enterTimeoutId);
    this.session.stopHintTimer();
    this.tts.cancel();
    if (!this.state.finished) {
      this.saveSession(true);
    }
  }

  get question(): GameAQuestion {
    return this.session.getQuestion(this.state);
  }

  get progressPercent(): number {
    return Math.round(((this.state.index + 1) / this.state.questions.length) * 100);
  }

  private updateShuffledChoices(): void {
    if (!this.state.finished && this.question && this.question.type === 'multiple-choice') {
      const allChoices = this.question.choices || [];
      const maxChoices = this.state.profile?.answerCount || 4;

      if (allChoices.length > 0) {
        const correctChoice = allChoices.find(c => c.id === this.question.correctChoiceId);
        let wrongChoices = allChoices.filter(c => c.id !== this.question.correctChoiceId);
        wrongChoices = this.shuffleArray(wrongChoices);
        const selectedWrong = wrongChoices.slice(0, maxChoices - 1);
        const finalChoices = correctChoice ? [correctChoice, ...selectedWrong] : selectedWrong;
        this.shuffledChoices = this.shuffleArray(finalChoices);
      } else {
        this.shuffledChoices = [];
      }
    }
  }

  private initializeChronoOrder(): void {
    if (this.question && this.question.type === 'chrono-order' && this.question.steps) {
      this.placedSteps = [null, null, null, null];
      this.availableSteps = this.shuffleArray([...this.question.steps]);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  onChoose(choiceId: GameAChoice['id']): void {
    if (this.state.locked || this.state.finished) return;
    this.readingChoiceId = null;
    this.tts.cancel();
    this.shuffledChoices.forEach(c => (c as any).isHinted = false);

    const q = this.question;

    if (q?.correctChoiceId && choiceId !== q.correctChoiceId) {
      // Mauvaise réponse : retirer le choix et continuer
      this.wrongAnswers++;
      this.soundEffects.play('gentleError');
      this.shuffledChoices = this.shuffledChoices.filter(c => c.id !== choiceId);
      this.startAssistFlow(false);
      return;
    }

    // Bonne réponse
    this.recordLatency();
    this.clearAssistFlow();
    this.soundEffects.play('success');
    this.state = this.session.choose(this.state, choiceId);
    if (this.state.locked) {
      if (this.autoNextQuestionTimeoutId) {
        window.clearTimeout(this.autoNextQuestionTimeoutId);
      }
      this.autoNextQuestionTimeoutId = window.setTimeout(() => {
        this.onNext();
      }, 5000);
    }
  }

  onChronoStepClick(step: GameAStep, fromPlaced: boolean = false): void {
    if (this.state.locked || this.state.finished) return;
    this.soundEffects.play('select');
    let hasChanged = false;

    if (fromPlaced) {
      const index = this.placedSteps.indexOf(step);
      if (index !== -1) {
        this.placedSteps[index] = null;
        this.availableSteps.push(step);
        this.availableSteps = this.shuffleArray(this.availableSteps);
        hasChanged = true;
      }
    } else {
      const index = this.availableSteps.indexOf(step);
      if (index !== -1) {
        this.availableSteps.splice(index, 1);
        const emptyIndex = this.placedSteps.findIndex(s => s === null);
        if (emptyIndex !== -1) {
          this.placedSteps[emptyIndex] = step;
          hasChanged = true;
        }
      }
    }

    if (!hasChanged) return;

    for (const availableStep of this.availableSteps) {
      availableStep.isHinted = false;
    }
    this.state = { ...this.state, hint: null, feedback: null };
    this.startAssistFlow(false);

    if (this.placedSteps.every(s => s !== null)) {
      this.validateChronoOrder();
    }
  }

  private validateChronoOrder(): void {
    const placedOrder = this.placedSteps.filter(s => s !== null).map(s => s!.id);
    this.recordLatency();
    this.clearAssistFlow();
    this.state = this.session.validateChronoOrder(this.state, placedOrder);
    if (this.state.locked) {
      if (this.autoNextQuestionTimeoutId) {
        window.clearTimeout(this.autoNextQuestionTimeoutId);
      }
      this.autoNextQuestionTimeoutId = window.setTimeout(() => {
        this.onNext();
      }, 5000);
    }
  }

  onHint(isAutomatic: boolean = false): void {
    if (this.state.locked || this.state.finished) return;

    if (!isAutomatic) {
      this.hintCount++;
    }

    this.soundEffects.play('hint');

    if (this.question.type === 'chrono-order' && this.question.correctOrder) {
      const placedIds = this.placedSteps.filter(s => s !== null).map(s => s!.id);
      for (const correctId of this.question.correctOrder) {
        if (!placedIds.includes(correctId)) {
          const step = this.availableSteps.find(s => s.id === correctId);
          if (step) {
            step.isHinted = true;
          }
          break;
        }
      }
      this.state = this.session.showHint(this.state);
    } else if (this.question.type === 'multiple-choice') {
      const correctChoice = this.shuffledChoices.find(c => c.id === this.question.correctChoiceId);
      if (correctChoice) {
        (correctChoice as any).isHinted = true;
      }
      this.state = this.session.showHint(this.state);
    }

    if (isAutomatic && this.state.hint) {
      this.readingChoiceId = null;
      this.cdr.detectChanges();
      this.tts.speak(`Voici un indice. ${this.state.hint}`);
    } else if (this.state.hint) {
      this.readingChoiceId = null;
      this.cdr.detectChanges();
      this.tts.speak(this.state.hint);
    }
  }

  onSkip(): void {
    if (this.state.finished) return;
    const confirmed = window.confirm('Êtes-vous sûr de vouloir passer cette question ?');
    if (!confirmed) return;
    this.skippedCount++;
    this.recordLatency();
    this.clearAssistFlow();
    this.state = this.session.skip(this.state);
  }

  onNext(): void {
    if (this.navigating) return;
    this.navigating = true;
    try {
      this.readingChoiceId = null;
      this.tts.cancel();
      this.soundEffects.play('transition');
      if (this.autoNextQuestionTimeoutId) window.clearTimeout(this.autoNextQuestionTimeoutId);
      this.autoNextQuestionTimeoutId = null;
      this.clearAssistFlow();
      this.isAutoRevealed = false;

      this.state = this.session.next(this.state);

      if (this.state.finished) {
        this.saveSession();
        void this.router.navigate(['/games/end']);
        return;
      }

      this.updateShuffledChoices();
      this.initializeChronoOrder();
      this.startAssistFlow(true);
      this.triggerEnterAnimation();
    } finally {
      this.navigating = false;
    }
  }

  get readTexts(): string[] {
    if (this.state.finished) return [];
    if (this.question.type === 'multiple-choice' && this.shuffledChoices.length) {
      return [this.question.prompt, ...this.shuffledChoices.map(c => c.label)];
    }
    return [this.question.prompt];
  }

  onReadItemStart(index: number | null): void {
    if (index === null || index === 0) {
      this.readingChoiceId = null;
    } else {
      this.readingChoiceId = this.shuffledChoices[index - 1]?.id ?? null;
    }
  }

  onTogglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.clearAssistFlow();
      return;
    }
    if (!this.state.finished && !this.state.locked) this.startAssistFlow(false);
  }

  isCorrectChoice(choiceId: GameAChoice['id']): boolean {
    return this.state.locked && choiceId === this.question.correctChoiceId;
  }

  isWrongSelectedChoice(choiceId: GameAChoice['id']): boolean {
    return (
      this.state.locked &&
      this.state.selectedChoiceId === choiceId &&
      this.state.selectedChoiceId !== this.question.correctChoiceId
    );
  }

  isAutoHighlighted(choiceId: GameAChoice['id']): boolean {
    return this.isAutoRevealed && this.state.locked && choiceId === this.question.correctChoiceId;
  }

  private startAssistFlow(isNewQuestion: boolean = true): void {
    if (this.isPaused) return;
    this.clearAssistFlow();
    this.isAutoRevealed = false;

    if (isNewQuestion) {
      this.questionStartTime = Date.now();
    }

    this.hintTimeoutId = window.setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.state.locked && !this.state.finished) {
          this.onHint(true);
          this.cdr.detectChanges();
        }
      });
    }, (this.state.profile?.hintDelaySeconds || 12) * 1000);

    const revealDelay = ((this.state.profile?.hintDelaySeconds || 12) + 20) * 1000;
    const nextDelay = revealDelay + 5000;

    this.autoRevealTimeoutId = window.setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.state.locked && !this.state.finished) {
          this.guidedMoments++;
          this.recordLatency();

          if (this.question.type === 'multiple-choice') {
            const correctId = this.question.correctChoiceId;
            this.state = this.session.choose(this.state, correctId as any);
            this.isAutoRevealed = true;
            this.state = { ...this.state, feedback: 'Nous vous aidons : voici la bonne réponse ✅' };
          }
          else if (this.question.type === 'chrono-order' && this.question.correctOrder) {
            const correctSteps = this.question.correctOrder.map(id =>
              this.question.steps!.find(s => s.id === id)!
            );
            this.placedSteps = [...correctSteps];
            this.availableSteps = [];
            this.isAutoRevealed = true;
            this.state = { ...this.state, feedback: 'Nous vous aidons : voici le bon ordre ✅' };
            this.validateChronoOrder();
          }
          this.cdr.detectChanges();
        }
      });
    }, revealDelay);

    this.autoNextTimeoutId = window.setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.state.finished) this.onNext();
      });
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
    if (signals === 0) return 'Séance fluide, aucun indice nécessaire. Augmenter progressivement la difficulté.';
    if (signals <= 2) return 'Quelques indices utilisés. Maintenir le niveau et observer la séance suivante.';
    return "Plusieurs moments d'accompagnement. Favoriser des supports plus familiers à la prochaine séance.";
  }

  private saveSession(earlyStop = false): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    const duration = Math.max(1, Math.round((Date.now() - Date.parse(this.startedAt)) / 60000));
    const session = this.sessionSummary.build({
      patientId: patient.id,
      gameType: 'game-a',
      startedAt: this.startedAt,
      durationMinutes: duration,
      hintCount: this.hintCount,
      guidedMoments: this.guidedMoments,
      skippedMoments: this.skippedCount,
      wrongAnswers: this.wrongAnswers,
      totalQuestions: this.state.questions.length,
      correctAnswers: Math.max(0, this.state.questions.length - this.wrongAnswers - this.skippedCount),
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
    if (this.autoNextQuestionTimeoutId) window.clearTimeout(this.autoNextQuestionTimeoutId);
    this.hintTimeoutId = null;
    this.autoRevealTimeoutId = null;
    this.autoNextTimeoutId = null;
    this.autoNextQuestionTimeoutId = null;
  }

}

