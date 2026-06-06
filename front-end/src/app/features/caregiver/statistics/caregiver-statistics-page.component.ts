import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Battery,
  ChevronDown,
  CircleHelp,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  MessageSquare,
  Save,
  Target,
} from 'lucide-angular';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { SessionResult as Session } from '../../../models/session.model';
import { StatisticsService } from '../services/statistics.service';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

type KpiTone = 'good' | 'medium' | 'attention';
type KpiIcon = 'battery' | 'target' | 'circle-help';
type KpiScope = 'last-session' | 'lifetime';

interface CaregiverKpiGauge {
  title: string;
  value: string;
  subtitle: string;
  detail: string;
  formula: string;
  percent: number;
  tone: KpiTone;
  icon: KpiIcon;
}

interface KpiGaugeSection {
  id: KpiScope;
  eyebrow: string;
  title: string;
  subtitle: string;
  gauges: CaregiverKpiGauge[];
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
  kpiSections: KpiGaugeSection[];
  recentSessions: RecentSessionView[];
  dataSummary: string;
  practicalTip: string;
}

interface SessionTotals {
  sessionCount: number;
  totalQuestions: number;
  totalGoodAnswers: number;
  totalErrors: number;
  totalIndices: number;
  totalPassed: number;
  assistancePercent: number;
  successRate: number;
  blockingPercent: number;
}

@Component({
  selector: 'app-caregiver-statistics-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CaregiverShellComponent, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Battery, ChevronDown, CircleHelp, MessageSquare, Save, Target }),
    },
  ],
  templateUrl: './caregiver-statistics-page.component.html',
  styleUrls: ['./caregiver-statistics-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverStatisticsPageComponent implements OnInit, OnDestroy {
  private readonly transmissionStoragePrefix = 'mc_session_transmissions';
  private readonly transmissionSaveDebounceMs = 300;
  activePatientName = '';
  activePatientId = '';
  sessions: Session[] = [];
  dashboard: CaregiverDashboardView = this.buildDashboard([]);
  hasSessions = false;
  isLoading = true;
  transmissionNotes: Record<string, string> = {};

  expandedNotes: Set<string> = new Set<string>();

  private patientSubscription?: Subscription;
  private transmissionSaveTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly statisticsService: StatisticsService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.patientSubscription = this.patientContextService.activePatient$
      .pipe(
        switchMap((patient) => {
          this.flushTransmissionSave(this.activePatientId);
          this.activePatientName = patient.firstName;
          this.activePatientId = patient.id;
          this.transmissionNotes = this.loadTransmissionNotes(patient.id);
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

  trackByKpiSection(_: number, item: KpiGaugeSection): string {
    return item.id;
  }

  trackByGauge(_: number, item: CaregiverKpiGauge): string {
    return item.title;
  }

  trackBySession(_: number, item: RecentSessionView): string {
    return item.id;
  }

  toggleNote(sessionId: string): void {
    if (this.expandedNotes.has(sessionId)) {
      this.expandedNotes.delete(sessionId);
    } else {
      this.expandedNotes.add(sessionId);
    }
  }

  isNoteExpanded(sessionId: string): boolean {
    return this.expandedNotes.has(sessionId);
  }

  saveNote(sessionId: string): void {
    this.scheduleTransmissionSave();
    this.expandedNotes.delete(sessionId);
  }

  getTransmissionForSession(sessionId: string): string {
    return this.transmissionNotes[sessionId] ?? '';
  }

  onTransmissionInput(sessionId: string, event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    const content = target?.value ?? '';
    this.transmissionNotes[sessionId] = content;
    this.scheduleTransmissionSave();
  }

  getGaugeBackground(gauge: CaregiverKpiGauge): string {
    return `conic-gradient(${this.getToneColor(gauge.tone)} ${gauge.percent * 3.6}deg, rgba(34, 48, 42, 0.08) 0deg)`;
  }

  ngOnDestroy(): void {
    this.flushTransmissionSave(this.activePatientId);
    this.patientSubscription?.unsubscribe();
  }

  private buildDashboard(sessions: Session[]): CaregiverDashboardView {
    const lastSession = sessions.length ? [sessions[0]] : [];
    const lastTotals = this.computeTotals(lastSession, 'last-session');
    const lifetimeTotals = this.computeTotals(sessions, 'lifetime');

    return {
      kpiSections: [
        {
          id: 'last-session',
          eyebrow: 'Dernière séance',
          title: 'Bilan de la dernière séance',
          subtitle: sessions[0]
            ? `${this.formatSessionDate(sessions[0].startedAt)} · ${this.mapGameLabel(sessions[0].gameType)}`
            : 'Aucune séance disponible',
          gauges: this.buildKpiGauges(lastTotals, 'last-session'),
        },
        {
          id: 'lifetime',
          eyebrow: 'Toutes les séances',
          title: 'Tendances globales (Toutes les séances)',
          subtitle: `${sessions.length} séance(s) prise(s) en compte · moyenne des ratios de chaque séance`,
          gauges: this.buildKpiGauges(lifetimeTotals, 'lifetime'),
        },
      ],
      recentSessions: sessions.map((session) => this.mapSession(session)),
      dataSummary: `${sessions.length} séance(s), ${lifetimeTotals.totalQuestions} question(s), ${lifetimeTotals.totalIndices} indice(s), ${lifetimeTotals.totalPassed} question(s) passée(s).`,
      practicalTip: this.buildPracticalTip(lifetimeTotals),
    };
  }

  private buildKpiGauges(totals: SessionTotals, scope: KpiScope): CaregiverKpiGauge[] {
    const assistanceDetailPrefix = scope === 'lifetime' ? 'En moyenne, ' : '';
    const successDetailPrefix = scope === 'lifetime' ? 'Sur la tendance globale, ' : '';
    const blockingDetailPrefix = scope === 'lifetime' ? 'Sur l’ensemble des séances, ' : '';

    return [
      {
        title: 'Assistance requise',
        value: `${totals.assistancePercent}%`,
        subtitle: `${totals.totalIndices + totals.totalPassed}/${totals.totalQuestions} aide(s) ou passage(s)`,
        detail: `${assistanceDetailPrefix}${this.buildAssistanceDetail(totals.assistancePercent)}`,
        formula: '(indices utilisés + questions passées) / questions proposées',
        percent: totals.assistancePercent,
        tone: this.getLowerIsBetterTone(totals.assistancePercent),
        icon: 'battery',
      },
      {
        title: 'Réussite observable',
        value: `${totals.successRate}%`,
        subtitle: `${totals.totalGoodAnswers}/${totals.totalQuestions} réussites`,
        detail: `${successDetailPrefix}${this.buildSuccessDetail(totals.successRate)}`,
        formula: '(bonnes réponses / questions proposées) × 100',
        percent: totals.successRate,
        tone: totals.successRate >= 75 ? 'good' : totals.successRate >= 50 ? 'medium' : 'attention',
        icon: 'target',
      },
      {
        title: 'Points de blocage',
        value: `${totals.blockingPercent}%`,
        subtitle: `${totals.totalErrors + totals.totalPassed}/${totals.totalQuestions} erreur(s) ou passage(s)`,
        detail: `${blockingDetailPrefix}${this.buildBlockingDetail(totals.blockingPercent)}`,
        formula: '(erreurs + questions passées) / questions proposées',
        percent: totals.blockingPercent,
        tone: this.getLowerIsBetterTone(totals.blockingPercent),
        icon: 'circle-help',
      },
    ];
  }

  private computeTotals(sessions: Session[], scope: KpiScope): SessionTotals {
    const totalQuestions = this.sum(sessions, (session) => this.getTotalQuestions(session));
    const totalErrors = this.sum(sessions, (session) => session.observation.wrongAnswers);
    const totalPassed = this.sum(sessions, (session) => session.observation.skippedMoments);
    const totalIndices = this.sum(sessions, (session) => session.observation.hintCount);
    const totalGoodAnswers = this.sum(sessions, (session) => this.getCorrectAnswers(session));

    const assistancePercent = scope === 'lifetime'
      ? this.averageSessionPercent(sessions, (session) => session.observation.hintCount + session.observation.skippedMoments)
      : this.computePercent(totalIndices + totalPassed, totalQuestions);
    const successRate = scope === 'lifetime'
      ? this.averageSessionPercent(sessions, (session) => this.getCorrectAnswers(session))
      : this.computePercent(totalGoodAnswers, totalQuestions);
    const blockingPercent = scope === 'lifetime'
      ? this.averageSessionPercent(sessions, (session) => session.observation.wrongAnswers + session.observation.skippedMoments)
      : this.computePercent(totalErrors + totalPassed, totalQuestions);

    return {
      sessionCount: sessions.length,
      totalQuestions,
      totalGoodAnswers,
      totalErrors,
      totalIndices,
      totalPassed,
      assistancePercent,
      successRate,
      blockingPercent,
    };
  }

  private averageSessionPercent(sessions: Session[], numeratorSelector: (session: Session) => number): number {
    const ratios = sessions
      .map((session) => this.computePercent(numeratorSelector(session), this.getTotalQuestions(session)))
      .filter((percent) => Number.isFinite(percent));

    if (!ratios.length) return 0;
    return this.clampPercent(Math.round(ratios.reduce((total, percent) => total + percent, 0) / ratios.length));
  }

  private computePercent(numerator: number, denominator: number): number {
    if (denominator <= 0) return 0;
    return this.clampPercent(Math.round((numerator / denominator) * 100));
  }

  private clampPercent(percent: number): number {
    return Math.max(0, Math.min(100, percent));
  }

  private getLowerIsBetterTone(percent: number): KpiTone {
    if (percent < 25) return 'good';
    if (percent < 50) return 'medium';
    return 'attention';
  }

  private getToneColor(tone: KpiTone): string {
    switch (tone) {
      case 'good': return '#6b8f71';
      case 'medium': return '#d4a96a';
      case 'attention': return '#e07070';
    }
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

  private buildAssistanceDetail(assistancePercent: number): string {
    if (assistancePercent < 25) return 'peu d’aide a été nécessaire : laisser du temps et valoriser l’initiative.';
    if (assistancePercent < 50) return 'prévoir une présence proche, reformuler puis laisser essayer seul.';
    return 'l’aide est fréquente : fractionner les consignes et limiter la mise en échec.';
  }

  private buildSuccessDetail(successRate: number): string {
    if (successRate >= 75) return 'le niveau semble accessible : conserver ce format pour valoriser la réussite.';
    if (successRate >= 50) return 'le niveau est utilisable avec quelques reformulations bienveillantes.';
    return 'réduire le nombre de choix ou choisir une activité plus familière.';
  }

  private buildBlockingDetail(blockingPercent: number): string {
    if (blockingPercent < 25) return 'parcours fluide : garder le rythme et les supports actuels.';
    if (blockingPercent < 50) return 'quelques arrêts : vérifier la fatigue et simplifier si besoin.';
    return 'beaucoup d’arrêts : raccourcir la séance et proposer plus d’indices visuels.';
  }

  private buildPracticalTip(totals: SessionTotals): string {
    if (totals.blockingPercent >= 50) return 'Pour la prochaine animation : réduire le nombre de choix et accepter plus vite le bouton “indice”.';
    if (totals.assistancePercent >= 50) return 'Pour la prochaine animation : démarrer en duo, rester à côté et fractionner chaque consigne.';
    if (totals.successRate > 0 && totals.successRate < 50) return 'Pour la prochaine animation : choisir des supports plus familiers avant d’augmenter la difficulté.';
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

  private saveTransmissionNotes(patientId: string = this.activePatientId, notes: Record<string, string> = this.transmissionNotes): void {
    if (!patientId) return;
    try {
      localStorage.setItem(this.getTransmissionStorageKey(patientId), JSON.stringify(notes));
    } catch {
      // Ignore localStorage failures (private mode / quota exceeded)
    }
  }

  private getTransmissionStorageKey(patientId: string): string {
    return `${this.transmissionStoragePrefix}_${patientId}`;
  }

  private scheduleTransmissionSave(): void {
    if (this.transmissionSaveTimeout) {
      clearTimeout(this.transmissionSaveTimeout);
    }

    this.transmissionSaveTimeout = setTimeout(() => {
      this.saveTransmissionNotes();
      this.transmissionSaveTimeout = undefined;
    }, this.transmissionSaveDebounceMs);
  }

  private flushTransmissionSave(patientId: string, notes: Record<string, string> = this.transmissionNotes): void {
    if (!this.transmissionSaveTimeout) return;
    clearTimeout(this.transmissionSaveTimeout);
    this.transmissionSaveTimeout = undefined;
    this.saveTransmissionNotes(patientId, notes);
  }
}
