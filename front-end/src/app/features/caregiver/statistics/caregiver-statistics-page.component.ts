import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { PatientId, PatientSummary } from '../../../models/patient.model';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

type KpiTone = 'good' | 'medium' | 'attention';
type KpiIcon = 'clock' | 'battery' | 'target' | 'circle-help';

interface RawSessionTrace {
  id: string;
  patientId: PatientId;
  dateLabel: string;
  activityLabel: string;
  durationMinutes: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  hintsUsed: number;
  skippedQuestions: number;
}

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

@Component({
  selector: 'app-caregiver-statistics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CaregiverShellComponent, LucideAngularModule],
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
  patients: PatientSummary[] = [];
  selectedPatientId!: PatientId;
  currentPatient!: PatientSummary;
  dashboard!: CaregiverDashboardView;

  private patientSubscription?: Subscription;

  private readonly weeklyGoalMinutes = 45;
  private readonly weeklyGoalSessions = 3;

  private readonly mockSessions: RawSessionTrace[] = [
    {
      id: 'marcel-1',
      patientId: 'marcel',
      dateLabel: 'Aujourd’hui',
      activityLabel: 'Associations du quotidien',
      durationMinutes: 11,
      totalQuestions: 8,
      correctAnswers: 5,
      wrongAnswers: 2,
      hintsUsed: 2,
      skippedQuestions: 1,
    },
    {
      id: 'marcel-2',
      patientId: 'marcel',
      dateLabel: 'Mercredi',
      activityLabel: 'Mémoire & réminiscence',
      durationMinutes: 13,
      totalQuestions: 10,
      correctAnswers: 7,
      wrongAnswers: 2,
      hintsUsed: 1,
      skippedQuestions: 1,
    },
    {
      id: 'marcel-3',
      patientId: 'marcel',
      dateLabel: 'Lundi',
      activityLabel: 'Mode duo',
      durationMinutes: 9,
      totalQuestions: 7,
      correctAnswers: 4,
      wrongAnswers: 2,
      hintsUsed: 3,
      skippedQuestions: 1,
    },
    {
      id: 'jean-1',
      patientId: 'jean',
      dateLabel: 'Jeudi',
      activityLabel: 'Associations du quotidien',
      durationMinutes: 8,
      totalQuestions: 8,
      correctAnswers: 3,
      wrongAnswers: 3,
      hintsUsed: 4,
      skippedQuestions: 2,
    },
    {
      id: 'jean-2',
      patientId: 'jean',
      dateLabel: 'Mardi',
      activityLabel: 'Mémoire & réminiscence',
      durationMinutes: 14,
      totalQuestions: 9,
      correctAnswers: 5,
      wrongAnswers: 3,
      hintsUsed: 2,
      skippedQuestions: 1,
    },
    {
      id: 'paul-1',
      patientId: 'paul',
      dateLabel: 'Aujourd’hui',
      activityLabel: 'Mode duo',
      durationMinutes: 17,
      totalQuestions: 12,
      correctAnswers: 10,
      wrongAnswers: 1,
      hintsUsed: 1,
      skippedQuestions: 1,
    },
    {
      id: 'paul-2',
      patientId: 'paul',
      dateLabel: 'Mercredi',
      activityLabel: 'Associations du quotidien',
      durationMinutes: 15,
      totalQuestions: 10,
      correctAnswers: 8,
      wrongAnswers: 1,
      hintsUsed: 0,
      skippedQuestions: 1,
    },
    {
      id: 'paul-3',
      patientId: 'paul',
      dateLabel: 'Mardi',
      activityLabel: 'Mémoire & réminiscence',
      durationMinutes: 16,
      totalQuestions: 10,
      correctAnswers: 7,
      wrongAnswers: 2,
      hintsUsed: 1,
      skippedQuestions: 1,
    },
  ];

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = this.patientContextService.getActivePatientSnapshot().id;
    this.refreshPage(this.selectedPatientId);

    this.patientSubscription = this.patientContextService.activePatient$.subscribe((patient) => {
      this.selectedPatientId = patient.id;
      this.refreshPage(patient.id);
    });
  }

  onPatientChange(patientId: string): void {
    const id = patientId as PatientId;
    this.patientContextService.setActivePatient(id);
    this.selectedPatientId = id;
    this.refreshPage(id);
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

  private refreshPage(patientId: PatientId): void {
    this.currentPatient = this.patientContextService.getActivePatientSnapshot();
    this.dashboard = this.buildDashboard(patientId);
    this.cdr.markForCheck();
  }

  private buildDashboard(patientId: PatientId): CaregiverDashboardView {
    const sessions = this.getSessionsForPatient(patientId);
    const totalDuration = this.sum(sessions, 'durationMinutes');
    const totalQuestions = this.sum(sessions, 'totalQuestions');
    const totalCorrect = this.sum(sessions, 'correctAnswers');
    const totalWrong = this.sum(sessions, 'wrongAnswers');
    const totalHints = this.sum(sessions, 'hintsUsed');
    const totalSkipped = this.sum(sessions, 'skippedQuestions');
    const assistanceSignals = totalHints + totalSkipped;
    const avgAssistanceSignals = sessions.length ? assistanceSignals / sessions.length : 0;
    const successRate = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const blockingSignals = totalWrong + totalSkipped;
    const blockingRate = totalQuestions ? Math.round((blockingSignals / totalQuestions) * 100) : 0;
    const participationPercent = Math.min(Math.round((totalDuration / this.weeklyGoalMinutes) * 100), 100);

    return {
      cards: [
        {
          title: 'Participation active',
          value: `${totalDuration} min`,
          subtitle: `${sessions.length}/${this.weeklyGoalSessions} séances cette semaine`,
          detail: this.buildParticipationDetail(totalDuration, sessions.length),
          formula: `Somme des durées de session : ${totalDuration} min`,
          percent: participationPercent,
          tone: participationPercent >= 80 ? 'good' : participationPercent >= 50 ? 'medium' : 'attention',
          icon: 'clock',
        },
        {
          title: 'Assistance requise',
          value: this.mapAssistanceLabel(avgAssistanceSignals),
          subtitle: `${totalHints} indice(s), ${totalSkipped} question(s) passée(s)`,
          detail: this.buildAssistanceDetail(avgAssistanceSignals),
          formula: '(indices + questions passées) / nombre de séances',
          percent: Math.min(Math.round((avgAssistanceSignals / 5) * 100), 100),
          tone: avgAssistanceSignals <= 1 ? 'good' : avgAssistanceSignals <= 3 ? 'medium' : 'attention',
          icon: 'battery',
        },
        {
          title: 'Réussite observable',
          value: `${successRate}%`,
          subtitle: `${totalCorrect}/${totalQuestions} réponses réussies`,
          detail: this.buildSuccessDetail(successRate),
          formula: 'bonnes réponses / questions proposées',
          percent: successRate,
          tone: successRate >= 75 ? 'good' : successRate >= 50 ? 'medium' : 'attention',
          icon: 'target',
        },
        {
          title: 'Points de blocage',
          value: this.mapBlockingLabel(blockingRate),
          subtitle: `${totalWrong} erreur(s), ${totalSkipped} question(s) passée(s)`,
          detail: this.buildBlockingDetail(blockingRate),
          formula: '(erreurs + questions passées) / questions proposées',
          percent: Math.min(blockingRate, 100),
          tone: blockingRate <= 25 ? 'good' : blockingRate <= 45 ? 'medium' : 'attention',
          icon: 'circle-help',
        },
      ],
      recentSessions: sessions.map((session) => this.mapSession(session)),
      weeklyRawSummary: `${sessions.length} séance(s), ${totalQuestions} question(s), ${totalHints} indice(s), ${totalSkipped} question(s) passée(s).`,
      practicalTip: this.buildPracticalTip(avgAssistanceSignals, blockingRate, participationPercent),
    };
  }

  private getSessionsForPatient(patientId: PatientId): RawSessionTrace[] {
    const patientSessions = this.mockSessions.filter((session) => session.patientId === patientId);
    return patientSessions.length ? patientSessions : this.mockSessions.filter((session) => session.patientId === 'marcel');
  }

  private mapSession(session: RawSessionTrace): RecentSessionView {
    return {
      id: session.id,
      dateLabel: session.dateLabel,
      activityLabel: session.activityLabel,
      durationLabel: `${session.durationMinutes} min`,
      assistanceLabel: `${session.hintsUsed} indice(s)`,
      successLabel: `${session.correctAnswers}/${session.totalQuestions} réussies`,
      skippedLabel: `${session.skippedQuestions} passée(s)`,
    };
  }

  private sum(sessions: RawSessionTrace[], key: keyof Pick<RawSessionTrace, 'durationMinutes' | 'totalQuestions' | 'correctAnswers' | 'wrongAnswers' | 'hintsUsed' | 'skippedQuestions'>): number {
    return sessions.reduce((total, session) => total + session[key], 0);
  }

  private mapAssistanceLabel(avgSignals: number): string {
    if (avgSignals <= 1) return 'Faible';
    if (avgSignals <= 3) return 'Modérée';
    return 'Soutenue';
  }

  private mapBlockingLabel(blockingRate: number): string {
    if (blockingRate <= 25) return 'Peu de blocages';
    if (blockingRate <= 45) return 'À surveiller';
    return 'À alléger';
  }

  private buildParticipationDetail(totalDuration: number, sessionsCount: number): string {
    if (totalDuration >= this.weeklyGoalMinutes) return 'L’accueilli participe suffisamment longtemps pour ritualiser l’activité.';
    if (sessionsCount >= 2) return 'La présence est régulière ; proposer une séance courte supplémentaire peut aider.';
    return 'Privilégier des séquences très courtes pour réinstaller progressivement l’habitude.';
  }

  private buildAssistanceDetail(avgSignals: number): string {
    if (avgSignals <= 1) return 'Peu de sollicitations : l’activité peut être lancée avec une consigne simple.';
    if (avgSignals <= 3) return 'Prévoir une présence proche au démarrage, puis laisser essayer seul.';
    return 'Rester à côté et fractionner les consignes pour limiter la mise en échec.';
  }

  private buildSuccessDetail(successRate: number): string {
    if (successRate >= 75) return 'Le niveau semble accessible : conserver ce format pour valoriser la réussite.';
    if (successRate >= 50) return 'Le niveau est utilisable avec quelques reformulations bienveillantes.';
    return 'Réduire le nombre de choix ou choisir une activité plus familière.';
  }

  private buildBlockingDetail(blockingRate: number): string {
    if (blockingRate <= 25) return 'Peu d’erreurs ou de questions passées : le parcours reste fluide.';
    if (blockingRate <= 45) return 'Quelques hésitations : vérifier la fatigue et simplifier si besoin.';
    return 'Beaucoup d’arrêts : raccourcir la séance et proposer plus d’indices visuels.';
  }

  private buildPracticalTip(avgAssistanceSignals: number, blockingRate: number, participationPercent: number): string {
    if (blockingRate > 45) return 'Pour la prochaine animation : réduire le nombre de questions et accepter plus vite le bouton “indice”.';
    if (avgAssistanceSignals > 3) return 'Pour la prochaine animation : démarrer en duo, puis laisser reprendre la main après la première réussite.';
    if (participationPercent < 50) return 'Pour la prochaine animation : viser deux séquences de 8 à 10 minutes plutôt qu’une longue séance.';
    return 'Pour la prochaine animation : garder le même niveau et féliciter explicitement les réussites.';
  }
}
