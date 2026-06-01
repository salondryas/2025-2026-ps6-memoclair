import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChartData, ChartOptions } from 'chart.js';
import {
  Battery,
  CircleHelp,
  Clock,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  Target,
} from 'lucide-angular';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { DEFAULT_PROFILE_OBJECTIVES, ProfileObjectives } from '../../../models/patient.model';
import { SessionResult as Session } from '../../../models/session.model';
import { StatisticsService } from '../services/statistics.service';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';
import { NgChartsModule } from 'ng2-charts';
import { CaregiverProfileService } from '../services/caregiver-profile.service';

type KpiTone = 'good' | 'medium' | 'attention';
type KpiIcon = 'clock' | 'battery' | 'target' | 'circle-help';

interface CaregiverKpiCard {
  title: string;
  value: string;
  subtitle: string;
  detail: string;
  formula: string;
  percent: number;
  tone: KpiTone;
  icon: KpiIcon;
}

interface RecentSessionView {
  id: string;
  dateLabel: string;
  activityLabel: string;
  durationLabel: string;
  assistanceLabel: string;
  successLabel: string;
  skippedLabel: string;
}

interface CaregiverDashboardView {
  cards: CaregiverKpiCard[];
  recentSessions: RecentSessionView[];
  weeklyRawSummary: string;
  practicalTip: string;
}

interface SessionTotals {
  totalDuration: number;
  nbrSessionsThisWeek: number;
  totalQuestions: number;
  totalGoodAnswers: number;
  totalErrors: number;
  totalIndices: number;
  totalPassed: number;
  assistanceAverage: number;
  successRate: number;
  blockingRatio: number;
  blockingPercent: number;
  participationPercent: number;
}

@Component({
  selector: 'app-caregiver-statistics-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CaregiverShellComponent, LucideAngularModule, NgChartsModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Clock, Battery, Target, CircleHelp }),
    },
  ],
  templateUrl: './caregiver-statistics-page.component.html',
  styleUrls: ['./caregiver-statistics-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverStatisticsPageComponent implements OnInit, OnDestroy {
  private readonly transmissionStoragePrefix = 'mc_session_transmissions';
  activePatientName = '';
  activePatientId = '';
  sessions: Session[] = [];
  dashboard: CaregiverDashboardView = this.buildDashboard([], this.computeTotals([]));
  hasSessions = false;
  isLoading = true;
  transmissionNotes: Record<string, string> = {};
  radarChartData: ChartData<'radar'> = this.buildRadarData([0, 0, 0, 0]);
  readonly radarChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 700,
      easing: 'easeOutQuart',
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false,
          stepSize: 20,
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(107, 143, 113, 0.12)',
          circular: true,
        },
        angleLines: {
          color: 'rgba(107, 143, 113, 0.14)',
        },
        pointLabels: {
          color: '#315b43',
          font: {
            size: 13,
            family: "'Inter', 'Segoe UI', sans-serif",
            weight: 700,
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#315b43',
          usePointStyle: true,
          boxWidth: 10,
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(31, 51, 40, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      },
    },
    elements: {
      line: {
        borderWidth: 2,
        tension: 0.25,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
  };

  private patientSubscription?: Subscription;
  private readonly weeklyGoalMinutes = 45;
  private objectives: ProfileObjectives = { ...DEFAULT_PROFILE_OBJECTIVES };

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly statisticsService: StatisticsService,
    private readonly caregiverProfileService: CaregiverProfileService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.patientSubscription = this.patientContextService.activePatient$
      .pipe(
        switchMap((patient) => {
          this.activePatientName = patient.firstName;
          this.activePatientId = patient.id;
          this.transmissionNotes = this.loadTransmissionNotes(patient.id);
          this.objectives = this.getObjectivesForPatient(patient.id);
          this.isLoading = true;
          this.cdr.markForCheck();

          return this.statisticsService.getSessionHistory(patient.id).pipe(
            catchError(() => of([] as Session[])),
          );
        }),
      )
      .subscribe((sessions) => {
        this.sessions = sessions;
        this.hasSessions = sessions.length > 0;
        const totals = this.computeTotals(sessions);
        this.dashboard = this.buildDashboard(sessions, totals);
        this.radarChartData = this.buildRadarData(this.normalizeRadarScores(totals));
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  trackByCard(_: number, item: CaregiverKpiCard): string {
    return item.title;
  }

  trackBySession(_: number, item: RecentSessionView): string {
    return item.id;
  }

  getTransmissionForSession(sessionId: string): string {
    return this.transmissionNotes[sessionId] ?? '';
  }

  onTransmissionInput(sessionId: string, event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    const content = target?.value ?? '';
    this.transmissionNotes = {
      ...this.transmissionNotes,
      [sessionId]: content,
    };
    this.saveTransmissionNotes();
  }

  ngOnDestroy(): void {
    this.patientSubscription?.unsubscribe();
  }

  private buildDashboard(sessions: Session[], totals: SessionTotals): CaregiverDashboardView {
    return {
      cards: [
        {
          title: 'Participation active',
          value: `${totals.totalDuration} min`,
          subtitle: `${totals.nbrSessionsThisWeek} séance(s) cette semaine`,
          detail: this.buildParticipationDetail(totals.totalDuration, totals.nbrSessionsThisWeek),
          formula: 'Somme des durées de toutes les sessions',
          percent: totals.participationPercent,
          tone: totals.participationPercent >= 80 ? 'good' : totals.participationPercent >= 50 ? 'medium' : 'attention',
          icon: 'clock',
        },
        {
          title: 'Assistance requise',
          value: this.mapAssistanceLabel(totals.assistanceAverage),
          subtitle: `${totals.totalIndices} indice(s), ${totals.totalPassed} question(s) passée(s)`,
          detail: this.buildAssistanceDetail(totals.assistanceAverage),
          formula: '(indices utilisés + questions passées) / nombre total de séances',
          percent: Math.min(Math.round((totals.assistanceAverage / 5) * 100), 100),
          tone: totals.assistanceAverage < 2 ? 'good' : totals.assistanceAverage < 5 ? 'medium' : 'attention',
          icon: 'battery',
        },
        {
          title: 'Réussite observable',
          value: `${totals.successRate}%`,
          subtitle: `${totals.totalGoodAnswers}/${totals.totalQuestions} réponses réussies`,
          detail: this.buildSuccessDetail(totals.successRate),
          formula: '(bonnes réponses / questions proposées) × 100',
          percent: totals.successRate,
          tone: totals.successRate >= 75 ? 'good' : totals.successRate >= 50 ? 'medium' : 'attention',
          icon: 'target',
        },
        {
          title: 'Points de blocage',
          value: this.mapBlockingLabel(totals.blockingRatio),
          subtitle: `${totals.totalErrors} erreur(s), ${totals.totalPassed} question(s) passée(s)`,
          detail: this.buildBlockingDetail(totals.blockingRatio),
          formula: '(erreurs + questions passées) / questions proposées',
          percent: totals.blockingPercent,
          tone: totals.blockingRatio < 0.25 ? 'good' : totals.blockingRatio < 0.5 ? 'medium' : 'attention',
          icon: 'circle-help',
        },
      ],
      recentSessions: sessions.map((session) => this.mapSession(session)),
      weeklyRawSummary: `${sessions.length} séance(s), ${totals.totalQuestions} question(s), ${totals.totalIndices} indice(s), ${totals.totalPassed} question(s) passée(s).`,
      practicalTip: this.buildPracticalTip(totals),
    };
  }

  private computeTotals(sessions: Session[]): SessionTotals {
    const totalDuration = this.sum(sessions, (session) => session.durationMinutes);
    const totalQuestions = this.sum(sessions, (session) => this.getTotalQuestions(session));
    const totalErrors = this.sum(sessions, (session) => session.observation.wrongAnswers);
    const totalPassed = this.sum(sessions, (session) => session.observation.skippedMoments);
    const totalIndices = this.sum(sessions, (session) => session.observation.hintCount);
    const totalGoodAnswers = this.sum(sessions, (session) => this.getCorrectAnswers(session));
    const assistanceAverage = sessions.length ? (totalIndices + totalPassed) / sessions.length : 0;
    const successRate = totalQuestions ? Math.round((totalGoodAnswers / totalQuestions) * 100) : 0;
    const blockingRatio = totalQuestions ? (totalErrors + totalPassed) / totalQuestions : 0;
    const blockingPercent = Math.min(Math.round(blockingRatio * 100), 100);

    return {
      totalDuration,
      nbrSessionsThisWeek: sessions.filter((session) => this.isSessionThisWeek(session)).length,
      totalQuestions,
      totalGoodAnswers,
      totalErrors,
      totalIndices,
      totalPassed,
      assistanceAverage,
      successRate,
      blockingRatio,
      blockingPercent,
      participationPercent: Math.min(Math.round((totalDuration / this.weeklyGoalMinutes) * 100), 100),
    };
  }

  private normalizeRadarScores(totals: SessionTotals): [number, number, number, number] {
    return [
      this.normalizeHigherIsBetter(totals.totalDuration, this.objectives.targetEngagementMinutes),
      this.normalizeLowerIsBetter(totals.totalIndices, this.objectives.targetAutonomyHintCount),
      this.normalizeHigherIsBetter(totals.successRate, this.objectives.targetSuccessRate),
      this.normalizeLowerIsBetter(totals.totalErrors, this.objectives.targetFluidityErrorCount),
    ];
  }

  private buildRadarData(scores: [number, number, number, number]): ChartData<'radar'> {
    return {
      labels: ['Engagement', 'Autonomie', 'Réussite', 'Fluidité'],
      datasets: [
        {
          label: 'Performance actuelle',
          data: scores,
          borderColor: '#3a7554',
          backgroundColor: 'rgba(58, 117, 84, 0.22)',
          pointBackgroundColor: '#3a7554',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: '#3a7554',
        },
        {
          label: 'Objectif',
          data: [100, 100, 100, 100],
          borderColor: 'rgba(107, 143, 113, 0.55)',
          borderDash: [7, 5],
          backgroundColor: 'rgba(107, 143, 113, 0.06)',
          pointRadius: 0,
        },
      ],
    };
  }

  private normalizeHigherIsBetter(actual: number, target: number): number {
    if (target <= 0) return 0;
    return this.clampScore((actual / target) * 100);
  }

  private normalizeLowerIsBetter(actual: number, maxExpected: number): number {
    if (maxExpected < 0) return 0;
    if (maxExpected === 0) return actual <= 0 ? 100 : 0;
    return this.clampScore(100 - (actual / maxExpected) * 100);
  }

  private clampScore(score: number): number {
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private getObjectivesForPatient(patientId: string): ProfileObjectives {
    const profile = this.caregiverProfileService.getProfile(patientId);
    return {
      ...DEFAULT_PROFILE_OBJECTIVES,
      ...(profile?.objectives ?? {}),
    };
  }

  private mapSession(session: Session): RecentSessionView {
    return {
      id: session.id,
      dateLabel: this.formatSessionDate(session.startedAt),
      activityLabel: this.mapGameLabel(session.gameType),
      durationLabel: `${session.durationMinutes} min`,
      assistanceLabel: `${session.observation.hintCount} indice(s)`,
      successLabel: `${this.getCorrectAnswers(session)}/${this.getTotalQuestions(session)} réussies`,
      skippedLabel: `${session.observation.skippedMoments} passée(s)`,
    };
  }

  private sum(sessions: Session[], selector: (session: Session) => number | undefined): number {
    return sessions.reduce((total, session) => total + (selector(session) ?? 0), 0);
  }

  private getTotalQuestions(session: Session): number {
    return session.totalQuestions ?? this.getCorrectAnswers(session) + session.observation.wrongAnswers + session.observation.skippedMoments;
  }

  private getCorrectAnswers(session: Session): number {
    if (session.correctAnswers !== undefined) return session.correctAnswers;
    return Math.max(0, (session.totalQuestions ?? 0) - session.observation.wrongAnswers - session.observation.skippedMoments);
  }

  private isSessionThisWeek(session: Session): boolean {
    const startedAt = new Date(session.startedAt);
    if (Number.isNaN(startedAt.getTime())) return false;

    const now = new Date();
    const weekStartsAt = new Date(now);
    const day = weekStartsAt.getDay() || 7;
    weekStartsAt.setDate(weekStartsAt.getDate() - day + 1);
    weekStartsAt.setHours(0, 0, 0, 0);

    return startedAt >= weekStartsAt && startedAt <= now;
  }

  private mapAssistanceLabel(avgSignals: number): string {
    if (avgSignals < 2) return 'Légère';
    if (avgSignals < 5) return 'Modérée';
    return 'Soutenue';
  }

  private mapBlockingLabel(blockingRatio: number): string {
    if (blockingRatio < 0.25) return 'Fluide';
    if (blockingRatio < 0.5) return 'Quelques arrêts';
    return 'À alléger';
  }

  private buildParticipationDetail(totalDuration: number, sessionsCount: number): string {
    if (totalDuration >= this.weeklyGoalMinutes) return 'Participation solide : conserver le rituel actuel et valoriser la régularité.';
    if (sessionsCount >= 2) return 'Participation en construction : ajouter une séance courte peut consolider l’habitude.';
    return 'Participation fragile : privilégier des séquences très courtes et prévisibles.';
  }

  private buildAssistanceDetail(avgSignals: number): string {
    if (avgSignals < 2) return 'Peu d’aide nécessaire : lancer avec une consigne simple et laisser du temps.';
    if (avgSignals < 5) return 'Prévoir une présence proche, reformuler puis laisser essayer seul.';
    return 'Rester à côté et fractionner les consignes pour limiter la mise en échec.';
  }

  private buildSuccessDetail(successRate: number): string {
    if (successRate >= 75) return 'Le niveau semble accessible : conserver ce format pour valoriser la réussite.';
    if (successRate >= 50) return 'Le niveau est utilisable avec quelques reformulations bienveillantes.';
    return 'Réduire le nombre de choix ou choisir une activité plus familière.';
  }

  private buildBlockingDetail(blockingRatio: number): string {
    if (blockingRatio < 0.25) return 'Parcours fluide : garder le rythme et les supports actuels.';
    if (blockingRatio < 0.5) return 'Quelques arrêts : vérifier la fatigue et simplifier si besoin.';
    return 'Beaucoup d’arrêts : raccourcir la séance et proposer plus d’indices visuels.';
  }

  private buildPracticalTip(totals: SessionTotals): string {
    if (totals.blockingRatio >= 0.5) return 'Pour la prochaine animation : réduire le nombre de choix et accepter plus vite le bouton “indice”.';
    if (totals.assistanceAverage >= 5) return 'Pour la prochaine animation : démarrer en duo, rester à côté et fractionner chaque consigne.';
    if (totals.successRate > 0 && totals.successRate < 50) return 'Pour la prochaine animation : choisir des supports plus familiers avant d’augmenter la difficulté.';
    if (totals.participationPercent < 50) return 'Pour la prochaine animation : viser deux séquences de 8 à 10 minutes plutôt qu’une longue séance.';
    return 'Pour la prochaine animation : garder le même niveau et féliciter explicitement les réussites.';
  }

  private formatSessionDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  private mapGameLabel(gameType: Session['gameType']): string {
    switch (gameType) {
      case 'game-a': return 'Associations du quotidien';
      case 'game-b': return 'Mémoire & réminiscence';
      case 'game-duo': return 'Mode duo';
    }
  }

  private loadTransmissionNotes(patientId: string): Record<string, string> {
    if (!patientId) return {};

    try {
      const raw = localStorage.getItem(this.getTransmissionStorageKey(patientId));
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, string>;
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  private saveTransmissionNotes(): void {
    if (!this.activePatientId) return;
    try {
      localStorage.setItem(this.getTransmissionStorageKey(this.activePatientId), JSON.stringify(this.transmissionNotes));
    } catch {
      // Ignore localStorage failures (private mode / quota exceeded)
    }
  }

  private getTransmissionStorageKey(patientId: string): string {
    return `${this.transmissionStoragePrefix}_${patientId}`;
  }
}
