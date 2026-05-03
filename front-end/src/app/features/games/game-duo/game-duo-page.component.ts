import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { StatisticsService } from '../../caregiver/services/statistics.service';
import { DuoFacilitationService, DuoRound, DuoState } from '../services/duo-facilitation.service';
import { SupportLevel, EmotionalState } from '../../../models/session.model';
import { SessionSummaryService } from '../services/session-summary.service';
import { GameHeaderComponent } from '../../../shared/components/game-header/game-header.component';
import { LargeAudioControlsComponent } from '../../../shared/components/games/large-audio-controls/large-audio-controls.component';
import { timeout } from 'rxjs/operators';

type PageState = 'loading' | 'not-enough-media' | 'error' | 'ready';

const DUO_REQUIRED = 9;

@Component({
  selector: 'app-game-duo-page',
  standalone: true,
  imports: [CommonModule, RouterModule, GameHeaderComponent, LargeAudioControlsComponent],
  templateUrl: './game-duo-page.component.html',
  styleUrls: ['./game-duo-page.component.scss'],
})
export class GameDuoPageComponent implements OnInit {
  pageState: PageState = 'loading';
  mediaCount = 0;
  errorMessage = '';
  readonly duoRequired = DUO_REQUIRED;

  state: DuoState = this.duo.createInitialState();
  readonly patient$ = this.patientContext.activePatient$;

  private readonly startedAt = new Date().toISOString();
  private passCount = 0;
  private answerWithPatientCount = 0;
  private agreedCount = 0;
  private roundStartTime = Date.now();
  private latencies: number[] = [];

  constructor(
    private readonly duo: DuoFacilitationService,
    private readonly patientContext: PatientContextService,
    private readonly statisticsService: StatisticsService,
    private readonly sessionSummary: SessionSummaryService,
    private readonly router: Router,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    this.generateQuestions(patient.id, patient.firstName);
  }

  get round() { return this.duo.activeRound(this.state); }
  get roundLabel(): string { return `Moment ${this.state.roundIndex + 1} / ${this.state.rounds.length}`; }
  get isLastRound(): boolean { return this.state.roundIndex === this.state.rounds.length - 1; }
  get dots(): number[] { return Array.from({ length: this.state.rounds.length }, (_, i) => i); }

  pickAidant(index: number): void { this.state = this.duo.pickAidant(this.state, index); }
  pickAccueilli(index: number): void { this.state = this.duo.pickAccueilli(this.state, index); }

  answerWithPatient(): void {
    this.answerWithPatientCount++;
    this.state = this.duo.answerWithPatient(this.state);
  }

  pass(): void {
    this.passCount++;
    this.recordLatency();
    this.state = this.duo.passRound(this.state);
  }

  nextRound(): void {
    if (this.state.agreed) this.agreedCount++;
    this.recordLatency();
    this.state = this.duo.nextRound(this.state);
    if (this.state.finished) {
      this.saveSession();
      void this.router.navigate(['/games/end'], { queryParams: { game: 'game-duo' } });
    } else {
      this.roundStartTime = Date.now();
    }
  }

  replayRound(): void {
    this.state = this.duo.replayRound(this.state);
  }

  retry(): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    this.pageState = 'loading';
    this.generateQuestions(patient.id, patient.firstName);
  }

  private generateQuestions(patientId: string, patientName: string): void {
    this.http.post<{ rounds: DuoRound[] }>(
      `${environment.backendUrl}/api/duo/generate/${patientId}`,
      { patientName },
    ).pipe(timeout(150000)).subscribe({
      next: ({ rounds }) => {
        this.state = {
          ...this.duo.createInitialState(),
          rounds,
        };
        this.pageState = 'ready';
      },
      error: (err) => {
        const body = err?.error;
        if (body?.error === 'not_enough_media') {
          this.mediaCount = body.count ?? 0;
          this.pageState = 'not-enough-media';
        } else {
          this.errorMessage = body?.error ?? 'Erreur inconnue.';
          this.pageState = 'error';
        }
      },
    });
  }

  private recordLatency(): void {
    const latency = Math.round((Date.now() - this.roundStartTime) / 1000);
    if (latency > 0) this.latencies.push(latency);
  }

  private computeAvgLatency(): number {
    if (!this.latencies.length) return 0;
    return Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length);
  }

  private computeSupportLevel(): SupportLevel {
    const signals = this.passCount + this.answerWithPatientCount;
    if (signals <= 1) return 'leger';
    if (signals <= 3) return 'modere';
    return 'important';
  }

  private computeEmotionalState(): EmotionalState {
    const total = this.state.rounds.length;
    const agreedRatio = total > 0 ? this.agreedCount / total : 0;
    if (agreedRatio >= 0.7) return 'engage';
    if (this.passCount >= 3) return 'fatigue';
    if (agreedRatio >= 0.4) return 'apaise';
    return 'variable';
  }

  private buildSummary(): string {
    const signals = this.passCount + this.answerWithPatientCount;
    if (signals === 0 && this.agreedCount >= this.state.rounds.length - 1)
      return 'Échange fluide et accord fréquent. Enrichir les supports au prochain échange.';
    if (signals <= 2)
      return 'Quelques moments accompagnés. Maintenir le rythme et la durée de la séance.';
    return 'Plusieurs passages assistés. Réduire la durée et choisir des supports très familiers.';
  }

  private saveSession(): void {
    const patient = this.patientContext.getActivePatientSnapshot();
    const duration = Math.max(1, Math.round((Date.now() - Date.parse(this.startedAt)) / 60000));
    const session = this.sessionSummary.build({
      patientId: patient.id,
      gameType: 'game-duo',
      startedAt: this.startedAt,
      durationMinutes: duration,
      hintCount: this.answerWithPatientCount,
      guidedMoments: this.answerWithPatientCount,
      skippedMoments: this.passCount,
      wrongAnswers: 0,
      earlyStop: false,
      latenciesSeconds: this.latencies,
      supportLevel: this.computeSupportLevel(),
      emotionalState: this.computeEmotionalState(),
      summary: this.buildSummary(),
    });

    this.statisticsService.recordSession(session);
  }
}
