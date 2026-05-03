import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ClinicalStage,
  DIFFICULTY_PRESETS,
  GameDifficulty,
  MotorLevel,
  PatientId,
  PatientProfile,
  PatientSummary,
  SelectOption,
  ThemeTag,
  VisionLevel,
} from '../../../models/patient.model';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { CaregiverProfileService } from '../services/caregiver-profile.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-caregiver-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SharedModule],
  templateUrl: './caregiver-profile-page.component.html',
  styleUrl: './caregiver-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaregiverProfilePageComponent implements OnInit, OnDestroy {
  patients: PatientSummary[] = [];
  selectedPatientId!: PatientId;
  profile!: PatientProfile;
  saveStatus = '';
  validationMessage = '';

  showCreateForm = false;
  newFirstName = '';
  createError = '';

  readonly difficultyOptions: ReadonlyArray<SelectOption<GameDifficulty>> = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' },
    { value: 'personnalise', label: 'Personnalisé' },
  ];
  readonly difficultyPresets = DIFFICULTY_PRESETS;

  readonly stageOptions: ReadonlyArray<SelectOption<ClinicalStage>>;
  readonly visionOptions: ReadonlyArray<SelectOption<VisionLevel>>;
  readonly motorOptions: ReadonlyArray<SelectOption<MotorLevel>>;
  readonly attentionOptions: ReadonlyArray<SelectOption<PatientProfile['attentionSpanMinutes']>>;
  readonly themeOptions: ReadonlyArray<SelectOption<ThemeTag>>;

  private patientSubscription?: Subscription;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly caregiverProfileService: CaregiverProfileService,
  ) {
    this.stageOptions = this.caregiverProfileService.stageOptions;
    this.visionOptions = this.caregiverProfileService.visionOptions;
    this.motorOptions = this.caregiverProfileService.motorOptions;
    this.attentionOptions = this.caregiverProfileService.attentionOptions;
    this.themeOptions = this.caregiverProfileService.themeOptions;
  }

  ngOnInit(): void {
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = this.patientContextService.getActivePatientSnapshot().id;
    this.loadProfile(this.selectedPatientId);

    this.patientSubscription = this.patientContextService.activePatient$.subscribe((patient) => {
      if (patient.id === this.selectedPatientId) {
        return;
      }

      this.selectedPatientId = patient.id;
      this.loadProfile(patient.id);
    });
  }

  onPatientChange(patientId: string): void {
    const typedPatientId = patientId as PatientId;
    this.patientContextService.setActivePatient(typedPatientId);
    this.selectedPatientId = typedPatientId;
    this.loadProfile(typedPatientId);
  }

  selectDifficulty(difficulty: GameDifficulty): void {
    this.profile = { ...this.profile, difficulty };
    if (difficulty !== 'personnalise') {
      const preset = DIFFICULTY_PRESETS[difficulty];
      this.profile = {
        ...this.profile,
        ...preset,
      };
    }
    this.clearMessages();
  }

  toggleAudio(enabled: boolean): void {
    this.profile = { ...this.profile, audioReadingEnabled: enabled };
    this.clearMessages();
  }

  toggleHighContrast(enabled: boolean): void {
    this.profile = { ...this.profile, highContrastEnabled: enabled };
    this.clearMessages();
  }

  updateTextSize(size: number): void {
    this.profile = { ...this.profile, textSize: size };
    this.clearMessages();
  }

  selectStage(stage: ClinicalStage): void {
    this.profile = { ...this.profile, stage };
    this.clearMessages();
  }

  selectVision(vision: VisionLevel): void {
    this.profile = { ...this.profile, vision };
    this.clearMessages();
  }

  selectMotor(motor: MotorLevel): void {
    this.profile = { ...this.profile, motor };
    this.clearMessages();
  }

  selectAttention(attentionSpanMinutes: PatientProfile['attentionSpanMinutes']): void {
    this.profile = { ...this.profile, attentionSpanMinutes };
    this.clearMessages();
  }

  toggleTheme(theme: ThemeTag): void {
    const alreadySelected = this.profile.themes.includes(theme);

    if (alreadySelected && this.profile.themes.length === 1) {
      this.validationMessage = 'Au moins un thème porteur doit rester sélectionné.';
      this.saveStatus = '';
      return;
    }

    this.profile = {
      ...this.profile,
      themes: alreadySelected
        ? this.profile.themes.filter((entry) => entry !== theme)
        : [...this.profile.themes, theme],
    };

    this.clearMessages();
  }

  saveProfile(): void {
    const errors = this.caregiverProfileService.validateProfile(this.profile);

    if (errors.length > 0) {
      this.validationMessage = errors[0];
      this.saveStatus = '';
      return;
    }

    this.profile = this.caregiverProfileService.saveProfile(this.profile);
    const currentPatient = this.currentPatient;
    this.validationMessage = '';
    this.saveStatus = `Profil de ${currentPatient.firstName} enregistré pour les prochaines séances.`;
  }

  isThemeSelected(theme: ThemeTag): boolean {
    return this.profile.themes.includes(theme);
  }

  isSelected<TValue extends string | number>(currentValue: TValue, selectedValue: TValue): boolean {
    return currentValue === selectedValue;
  }

  get summaryLines(): string[] {
    return this.caregiverProfileService.buildSummaryLines(this.profile);
  }

  get currentPatient(): PatientSummary {
    return (
      this.patients.find((patient) => patient.id === this.selectedPatientId)
      ?? this.patients[0]
      ?? {
        id: 'marcel',
        firstName: 'Marcel',
        displayName: 'Marcel D.',
        stageLabel: 'Stade avancé',
      }
    );
  }

  ngOnDestroy(): void {
    this.patientSubscription?.unsubscribe();
  }

  private loadProfile(patientId: PatientId): void {
    this.profile = this.caregiverProfileService.getProfile(patientId);
    this.validationMessage = '';
    this.saveStatus = '';
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.newFirstName = '';
    this.createError = '';
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.newFirstName = '';
    this.createError = '';
  }

  createPatient(): void {
    const firstName = this.newFirstName.trim();
    if (!firstName) {
      this.createError = 'Le prénom est requis.';
      return;
    }

    const id: PatientId = `patient-${Date.now()}`;
    const summary: PatientSummary = {
      id,
      firstName,
      displayName: firstName,
      stageLabel: 'Stade léger',
    };
    const profile: PatientProfile = {
      patientId: id,
      stage: 'leger',
      vision: 'leger',
      motor: 'leger',
      themes: ['quotidien'],
      attentionSpanMinutes: 15,
      difficulty: 'moyen',
      questionCount: 10,
      answerCount: 3,
      hintDelaySeconds: 20,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      updatedAt: null,
    };

    this.patientContextService.addPatient(summary, profile);
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = id;
    this.loadProfile(id);
    this.showCreateForm = false;
    this.saveStatus = `Profil de ${firstName} créé. Personnalisez ses réglages puis enregistrez.`;
  }

  clearMessages(): void {
    this.validationMessage = '';
    this.saveStatus = '';
  }
}
