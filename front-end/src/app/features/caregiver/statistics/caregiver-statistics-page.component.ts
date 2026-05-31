import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
import { SessionResult as Session } from '../../../models/session.model';
import { StatisticsService } from '../services/statistics.service';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

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
  imports: [CommonModule, RouterLink, CaregiverShellComponent, LucideAngularModule],
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
  activePatientName = '';
  sessions: Session[] = [];
  dashboard: CaregiverDashboardView = this.buildDashboard([]);
  hasSessions = false;
  isLoading = true;

  private patientSubscription?: Subscription;
  private readonly weeklyGoalMinutes = 45;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly statisticsService: StatisticsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.patientSubscription = this.patientContextService.activePatient$
      .pipe(
        switchMap((patient) => {
          this.activePatientName = patient.firstName;
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
        this.dashboard = this.buildDashboard(sessions);
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

  ngOnDestroy(): void {
    this.patientSubscription?.unsubscribe();
  }

  private buildDashboard(sessions: Session[]): CaregiverDashboardView {
    const totals = this.computeTotals(sessions);

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
}
