import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { ClinicalStage, PatientId, PatientSummary } from '../../../models/patient.model';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-profile-management-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SharedModule, FormsModule],
  templateUrl: './profile-management-page.component.html',
  styleUrl: './profile-management-page.component.scss',
})
export class ProfileManagementPageComponent implements OnInit {
  patients: PatientSummary[] = [];
  returnPath: string = '/games/patient-selection';
  isAddModalOpen = false;
  newProfile = { firstName: '', lastName: '', stage: '' as ClinicalStage | '' };

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
  }

  canDelete(): boolean {
    return this.patients.length > 1;
  }

  deletePatient(patientId: PatientId): void {
    if (!this.canDelete()) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
      // TODO: Implement actual deletion logic
      // For now, just remove from local array
      this.patients = this.patients.filter(p => p.id !== patientId);
    }
  }

  addPatient(): void {
    // TODO: Implement add patient logic
    // For now, just show a placeholder
    alert('Fonctionnalité d\'ajout de profil à implémenter');
  }

  openAddModal(): void {
    this.isAddModalOpen = true;
    this.newProfile = { firstName: '', lastName: '', stage: '' };
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.newProfile = { firstName: '', lastName: '', stage: '' };
  }

  get isFormValid(): boolean {
    return this.newProfile.firstName.trim().length > 0 && 
           this.newProfile.lastName.trim().length > 0 && 
           this.newProfile.stage !== '';
  }

  submitAddProfile(): void {
    if (!this.isFormValid) return;

    // Generate a simple ID based on the first name (lowercase)
    const newId = this.newProfile.firstName.toLowerCase().replace(/\s+/g, '') as PatientId;
    
    // Determine stage label
    const stageLabels: Record<ClinicalStage, string> = {
      leger: 'Léger',
      modere: 'Modéré',
      avance: 'Avancé'
    };

    const fullName = `${this.newProfile.firstName} ${this.newProfile.lastName}`;

    const newPatient: PatientSummary = {
      id: newId,
      firstName: this.newProfile.firstName,
      displayName: fullName,
      stageLabel: stageLabels[this.newProfile.stage as ClinicalStage]
    };

    // Add to patients list
    this.patients = [...this.patients, newPatient];
    
    // Close modal
    this.closeAddModal();
  }

  goBack(): void {
    this.router.navigate([this.returnPath]);
  }
}
