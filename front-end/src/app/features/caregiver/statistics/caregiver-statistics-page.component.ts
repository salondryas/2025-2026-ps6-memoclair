import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientId, PatientSummary } from '../../../models/patient.model';
import { StatisticsService, SessionDonutStats, SessionHistoryItem } from '../services/statistics.service';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

@Component({
  selector: 'app-caregiver-statistics-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CaregiverShellComponent],
  templateUrl: './caregiver-statistics-page.component.html',
  styleUrls: ['./caregiver-statistics-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverStatisticsPageComponent implements OnInit, OnDestroy {
  patients: PatientSummary[] = [];
  selectedPatientId!: PatientId;
  currentPatient!: PatientSummary;
  donutStats!: SessionDonutStats;
  sessionHistory: SessionHistoryItem[] = [];
  disclaimer = '';
  notesMap: Record<string, string> = {};

  readonly C = 314.16;

  private patientSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly statisticsService: StatisticsService,
    private readonly router: Router,
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

    // Rafraîchit les stats à chaque fois que l'utilisateur navigue vers cette page
    this.routerSubscription = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.selectedPatientId = this.patientContextService.getActivePatientSnapshot().id;
        this.refreshPage(this.selectedPatientId);
      });
  }

  onPatientChange(patientId: string): void {
    const id = patientId as PatientId;
    this.patientContextService.setActivePatient(id);
    this.selectedPatientId = id;
    this.refreshPage(id);
  }

  arc(pct: number): string {
    return `${(pct / 100) * this.C} ${this.C}`;
  }

  multiOffset(previousPcts: number[]): string {
    const usedArc = previousPcts.reduce((sum, p) => sum + (p / 100) * this.C, 0);
    return `${-usedArc}`;
  }

  trackByDate(_: number, item: SessionHistoryItem): string {
    return item.sessionId;
  }

  saveNote(sessionId: string, value: string): void {
    this.notesMap[sessionId] = value;
    localStorage.setItem(`mc_notes_${this.selectedPatientId}`, JSON.stringify(this.notesMap));
  }

  getNote(sessionId: string): string {
    return this.notesMap[sessionId] ?? '';
  }

  ngOnDestroy(): void {
    this.patientSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private refreshPage(patientId: PatientId): void {
    this.currentPatient = this.patientContextService.getActivePatientSnapshot();
    this.donutStats = this.statisticsService.buildDonutStats(patientId);
    this.sessionHistory = this.statisticsService.buildHistoryView(patientId);
    this.disclaimer = this.statisticsService.buildClinicalDisclaimer();
    const stored = localStorage.getItem(`mc_notes_${patientId}`);
    this.notesMap = stored ? JSON.parse(stored) : {};
    this.cdr.markForCheck();
  }
}
