import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ClinicalStage,
  DEFAULT_PROFILE_OBJECTIVES,
  DIFFICULTY_PRESETS,
  GameBAutoNextMode,
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
import { AccessibilityPreferencesService } from '../../../core/services/accessibility-preferences.service';
import { CaregiverShellComponent } from '../../../shared/components/layout/caregiver-shell/caregiver-shell.component';

@Component({
  selector: 'app-caregiver-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CaregiverShellComponent],
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
  caregiverFirstName = '';
  bgMusicDefault = false;

  readonly answerCountOptions = [2, 3, 4];

  readonly difficultyOptions: ReadonlyArray<SelectOption<GameDifficulty>> = [
    { value: 'facile', label: 'Facile' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'difficile', label: 'Difficile' },
    { value: 'personnalise', label: 'Personnalisé' },
  ];
  readonly difficultyPresets = DIFFICULTY_PRESETS;
  readonly autoNextOptions: ReadonlyArray<SelectOption<GameBAutoNextMode>> = [
    { value: 'manual', label: 'Manuel' },
    { value: '5s', label: 'Auto (5s)' },
    { value: '8s', label: 'Auto (8s)' },
  ];

  readonly stageOptions: ReadonlyArray<SelectOption<ClinicalStage>>;
  readonly visionOptions: ReadonlyArray<SelectOption<VisionLevel>>;
  readonly motorOptions: ReadonlyArray<SelectOption<MotorLevel>>;
  readonly attentionOptions: ReadonlyArray<SelectOption<PatientProfile['attentionSpanMinutes']>>;
  readonly themeOptions: ReadonlyArray<SelectOption<ThemeTag>>;

  private patientSubscription?: Subscription;

  constructor(
    private readonly patientContextService: PatientContextService,
    private readonly caregiverProfileService: CaregiverProfileService,
    private readonly accessibilityPrefs: AccessibilityPreferencesService,
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
      this.profile = { ...this.profile, ...preset };
    }
    this.autoSave();
  }

  toggleAudio(enabled: boolean): void {
    this.profile = { ...this.profile, audioReadingEnabled: enabled };
    this.autoSave();
  }

  selectAutoNextMode(mode: GameBAutoNextMode): void {
    this.profile = { ...this.profile, autoNextMode: mode };
    this.autoSave();
  }

  toggleHighContrast(enabled: boolean): void {
    this.profile = { ...this.profile, highContrastEnabled: enabled };
    this.accessibilityPrefs.setHighContrast(enabled);
    this.autoSave();
  }

  updateTextSize(size: number): void {
    this.profile = { ...this.profile, textSize: size };
    this.autoSave();
  }

  selectStage(stage: ClinicalStage): void {
    this.profile = { ...this.profile, stage };
    this.autoSave();
  }

  selectVision(vision: VisionLevel): void {
    this.profile = { ...this.profile, vision };
    this.autoSave();
  }

  selectMotor(motor: MotorLevel): void {
    this.profile = { ...this.profile, motor };
    this.autoSave();
  }

  selectAttention(attentionSpanMinutes: PatientProfile['attentionSpanMinutes']): void {
    this.profile = { ...this.profile, attentionSpanMinutes };
    this.autoSave();
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

    this.autoSave();
  }

  saveProfile(): void {
    const errors = this.caregiverProfileService.validateProfile(this.profile);

    if (errors.length > 0) {
      this.validationMessage = errors[0];
      this.saveStatus = '';
      return;
    }

    this.profile = this.caregiverProfileService.saveProfile(this.profile);
    this.validationMessage = '';
    this.saveStatus = `Profil de ${this.currentPatient.firstName} enregistré.`;
  }

  private autoSave(): void {
    this.clearMessages();
    this.caregiverProfileService.saveProfile(this.profile);
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
    this.accessibilityPrefs.applyFromProfile(this.profile);
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
      maxHintsPerQuestion: 2,
      maxHintsPerSession: 15,
      autoNextMode: '5s',
      answerNextSeconds: 5,
      inactionNextSeconds: 15,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES },
      updatedAt: null,
    };

    this.patientContextService.addPatient(summary, profile);
    this.patients = this.patientContextService.getPatients();
    this.selectedPatientId = id;
    this.loadProfile(id);
    this.showCreateForm = false;
    this.saveStatus = `Profil de ${firstName} créé. Personnalisez ses réglages puis enregistrez.`;
  }

  selectAnswerCount(count: number): void {
    this.profile = { ...this.profile, answerCount: count };
    this.autoSave();
  }

  onQuestionCountChange(): void {
    this.autoSave();
  }

  onHintDelayChange(): void {
    this.autoSave();
  }

  onTimingChange(): void {
    this.autoSave();
  }

  getAnswerDots(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

  toggleBgMusicDefault(enabled: boolean): void {
    this.bgMusicDefault = enabled;
    this.clearMessages();
  }

  clearMessages(): void {
    this.validationMessage = '';
    this.saveStatus = '';
  }
}
