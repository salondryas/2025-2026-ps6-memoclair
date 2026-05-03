import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientId, PatientProfile, PatientSummary } from '../../../models/patient.model';
import { CaregiverProfileService } from '../services/caregiver-profile.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-family-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule],
  templateUrl: './family-dashboard-page.component.html',
  styleUrl: './family-dashboard-page.component.scss',
})
export class FamilyDashboardPageComponent {
  readonly patients: PatientSummary[];

  selectedPatientId: PatientId;
  currentPatient: PatientSummary;
  currentProfile: PatientProfile;
  recommendationCards: Array<{ title: string; body: string }> = [];
  postureTips: string[];
  summaryLines: string[];

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly caregiverProfileService: CaregiverProfileService,
    private readonly location: Location,
  ) {
    this.patients = this.patientContextService.getPatients();
    this.currentPatient = this.patientContextService.getActivePatientSnapshot();
    this.selectedPatientId = this.currentPatient.id;
    this.currentProfile = this.caregiverProfileService.getProfile(this.currentPatient.id);
    this.recommendationCards = [];
    this.postureTips = [];
    this.summaryLines = [];
    this.refreshDashboard(this.currentPatient.id);
  }

  goBack(): void {
    this.location.back();
  }

  onPatientChange(patientId: string): void {
    this.patientContextService.setActivePatient(patientId as PatientId);
    this.refreshDashboard(patientId as PatientId);
  }

  getThemeLabel(theme: string): string {
    return this.caregiverProfileService.getThemeLabel(theme as any);
  }

  trackByTitle(index: number, card: { title: string }): string {
    return `${index}-${card.title}`;
  }

  private refreshDashboard(patientId: PatientId): void {
    this.currentPatient = this.patientContextService.getActivePatientSnapshot();
    this.selectedPatientId = patientId;
    this.currentProfile = this.caregiverProfileService.getProfile(patientId);
    this.summaryLines = this.caregiverProfileService.buildSummaryLines(this.currentProfile);
    this.postureTips = this.caregiverProfileService.buildStageGuidance(this.currentProfile);
    const recommendations = this.caregiverProfileService.buildFamilyRecommendations(this.currentProfile);
    this.recommendationCards = this.currentProfile.themes.map((theme, index) => ({
      title: `${index + 1}. ${this.caregiverProfileService.getThemeLabel(theme)}`,
      body: recommendations[index]
        ?? 'Gardez un format court et rassurant, puis passez sans insister si une gêne apparaît.',
    }));
  }
}
