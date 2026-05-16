import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import {
  ClinicalStage,
  GameDifficulty,
  PatientId,
  PatientProfile,
  PatientSummary,
} from '../../../models/patient.model';

@Component({
  selector: 'app-profile-management-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile-management-page.component.html',
  styleUrl: './profile-management-page.component.scss',
})
export class ProfileManagementPageComponent implements OnInit {
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  patients: PatientSummary[] = [];
  isAddModalOpen = false;
  newProfile = {
    firstName: '',
    lastName: '',
    stage: '' as ClinicalStage | '',
    avatarUrl: '',
  };

  private readonly builtInIds = ['marcel', 'jean', 'paul'];
  private readonly returnPath = '/games/patient-selection';

  private readonly stageLabels: Record<ClinicalStage, string> = {
    leger: 'Stade léger',
    modere: 'Stade modéré',
    avance: 'Stade avancé',
  };

  private readonly stagePresets: Record<
    ClinicalStage,
    {
      difficulty: GameDifficulty;
      questionCount: number;
      answerCount: number;
      hintDelaySeconds: number;
      attentionSpanMinutes: 5 | 10 | 15 | 20;
    }
  > = {
    leger:  { difficulty: 'difficile', questionCount: 15, answerCount: 4, hintDelaySeconds: 30, attentionSpanMinutes: 15 },
    modere: { difficulty: 'moyen',     questionCount: 10, answerCount: 3, hintDelaySeconds: 20, attentionSpanMinutes: 10 },
    avance: { difficulty: 'facile',    questionCount: 5,  answerCount: 2, hintDelaySeconds: 10, attentionSpanMinutes: 5  },
  };

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
  }

  canDelete(patientId: PatientId): boolean {
    return !this.builtInIds.includes(patientId) && this.patients.length > 1;
  }

  deletePatient(patientId: PatientId): void {
    if (!this.canDelete(patientId)) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
      this.patientContextService.removePatient(patientId);
      this.patients = this.patientContextService.getPatients();
    }
  }

  openAddModal(): void {
    this.isAddModalOpen = true;
    this.newProfile = { firstName: '', lastName: '', stage: '', avatarUrl: '' };
  }

  closeAddModal(): void {
    this.isAddModalOpen = false;
    this.newProfile = { firstName: '', lastName: '', stage: '', avatarUrl: '' };
  }

  get isFormValid(): boolean {
    return (
      this.newProfile.firstName.trim().length > 0 &&
      this.newProfile.lastName.trim().length > 0 &&
      this.newProfile.stage !== ''
    );
  }

  triggerPhotoInput(): void {
    this.photoInput.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 3 * 1024 * 1024) {
      alert('La photo ne doit pas dépasser 3 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.newProfile.avatarUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  submitAddProfile(): void {
    if (!this.isFormValid) return;

    const stage = this.newProfile.stage as ClinicalStage;
    const firstName = this.newProfile.firstName.trim();
    const lastName = this.newProfile.lastName.trim();
    const newId = `${firstName.toLowerCase().replace(/\s+/g, '')}_${Date.now()}` as PatientId;
    const preset = this.stagePresets[stage];

    const summary: PatientSummary = {
      id: newId,
      firstName,
      displayName: `${firstName} ${lastName}`,
      stageLabel: this.stageLabels[stage],
      avatarUrl: this.newProfile.avatarUrl || undefined,
    };

    const profile: PatientProfile = {
      patientId: newId,
      stage,
      vision: 'leger',
      motor: 'leger',
      themes: ['quotidien'],
      attentionSpanMinutes: preset.attentionSpanMinutes,
      difficulty: preset.difficulty,
      questionCount: preset.questionCount,
      answerCount: preset.answerCount,
      hintDelaySeconds: preset.hintDelaySeconds,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      updatedAt: null,
    };

    this.patientContextService.addPatient(summary, profile);
    this.patients = this.patientContextService.getPatients();
    this.closeAddModal();
  }

  goBack(): void {
    this.router.navigate([this.returnPath]);
  }
}
