import { Component, OnDestroy, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-game-a-page',
  standalone: true,
  imports: [CommonModule, RouterModule, GameHeaderComponent, MascotDecoratorComponent, ChoiceCardComponent],
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

  isAutoRevealed = false;
  private hintTimeoutId: number | null = null;
  private autoRevealTimeoutId: number | null = null;
  private autoNextTimeoutId: number | null = null;
  private autoNextQuestionTimeoutId: number | null = null;
  private transitionTimeoutId: number | null = null;

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
    private readonly soundEffects: SoundEffectsService
  ) {}

  ngOnInit(): void {
    this.updateShuffledChoices();
    this.initializeChronoOrder();
    this.startAssistFlow();
  }

  ngOnDestroy(): void {
    this.clearAssistFlow();
    if (this.transitionTimeoutId) window.clearTimeout(this.transitionTimeoutId);
    this.session.stopHintTimer();
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
      this.shuffledChoices = this.shuffleArray(this.question.choices || []);
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
    this.recordLatency();
    this.clearAssistFlow();
    const q = this.question;
    if (q?.correctChoiceId && choiceId !== q.correctChoiceId) this.wrongAnswers++;
    this.soundEffects.play(q?.correctChoiceId === choiceId ? 'success' : 'gentleError');
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
    this.startAssistFlow();

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

  onHint(): void {
    if (this.state.locked || this.state.finished) return;
    this.hintCount++;
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
    } else {
      this.state = this.session.showHint(this.state);
    }
  }

  onSkip(): void {
    if (this.state.finished) return;
    this.skippedCount++;
    this.recordLatency();
    this.clearAssistFlow();
    this.state = this.session.skip(this.state);
  }

  onNext(): void {
    if (this.isTransitioning) return;
    this.soundEffects.play('transition');
    if (this.autoNextQuestionTimeoutId) window.clearTimeout(this.autoNextQuestionTimeoutId);
    this.autoNextQuestionTimeoutId = null;
    this.clearAssistFlow();
    this.isAutoRevealed = false;
    this.isTransitioning = true;
    this.transitionTimeoutId = window.setTimeout(() => {
      this.state = this.session.next(this.state);
      this.isTransitioning = false;
      this.transitionTimeoutId = null;

      if (this.state.finished) {
        this.saveSession();
        this.router.navigate(['/games/end']);
        return;
      }

      this.updateShuffledChoices();
      this.initializeChronoOrder();
      this.startAssistFlow();
    }, 350);
  }

  onReadQuestion(): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(this.question.prompt);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  onTogglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.clearAssistFlow();
      return;
    }
    if (!this.state.finished && !this.state.locked) this.startAssistFlow();
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

  private startAssistFlow(): void {
    if (this.isPaused) return;
    this.clearAssistFlow();
    this.isAutoRevealed = false;
    this.questionStartTime = Date.now();

    this.hintTimeoutId = window.setTimeout(() => {
      if (!this.state.locked && !this.state.finished) {
        this.hintCount++;
        this.onHint();
      }
    }, (this.state.profile?.hintDelaySeconds || 12) * 1000);

    const revealDelay = ((this.state.profile?.hintDelaySeconds || 12) + 20) * 1000;
    const nextDelay = revealDelay + 5000;

    this.autoRevealTimeoutId = window.setTimeout(() => {
      if (!this.state.locked && !this.state.finished) {
        this.guidedMoments++;
        this.recordLatency();

        // 1. COMPORTEMENT POUR CHOIX MULTIPLE
        if (this.question.type === 'multiple-choice') {
          const correctId = this.question.correctChoiceId;
          this.state = this.session.choose(this.state, correctId as any);
          this.isAutoRevealed = true;
          this.state = { ...this.state, feedback: 'Nous vous aidons : voici la bonne réponse ✅' };
        }

        // 2. NOUVEAU COMPORTEMENT POUR ORDRE CHRONOLOGIQUE
        else if (this.question.type === 'chrono-order' && this.question.correctOrder) {
          // On va chercher les images dans le bon ordre et on remplit toutes les zones d'un coup
          const correctSteps = this.question.correctOrder.map(id =>
            this.question.steps!.find(s => s.id === id)!
          );

          this.placedSteps = [...correctSteps]; // On remplit les zones en haut
          this.availableSteps = []; // On vide les choix en bas
          this.isAutoRevealed = true;

          this.state = { ...this.state, feedback: 'Nous vous aidons : voici le bon ordre ✅' };

          // On valide pour déclencher la lueur verte avant de passer à la suite
          this.validateChronoOrder();
        }
      }
    }, revealDelay);

    this.autoNextTimeoutId = window.setTimeout(() => {
      if (!this.state.finished) this.onNext();
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
