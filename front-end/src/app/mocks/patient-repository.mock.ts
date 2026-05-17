import { Injectable } from '@angular/core';

import { PatientId, PatientProfile, PatientSummary } from '../models/patient.model';
import { FamilyPatientAssociation, ManagedProfile } from '../models/profile.model';
import { StorageService } from '../core/services/storage.service';

const CUSTOM_PATIENTS_KEY = 'mc_custom_patients';
const CUSTOM_PROFILES_KEY = 'mc_custom_profiles';
const MANAGED_PROFILES_KEY = 'mc_managed_profiles';
const FAMILY_PATIENT_ASSOCIATIONS_KEY = 'mc_family_patient_associations';

const BUILT_IN_IDS = ['marcel', 'jean', 'paul'];

@Injectable({
  providedIn: 'root',
})
export class PatientRepositoryMock {
  private readonly builtInPatients: PatientSummary[] = [
    {
      id: 'marcel',
      firstName: 'Marcel',
      displayName: 'Marcel D.',
      stageLabel: 'Stade avancé',
      avatarUrl: 'assets/patients/Marcel.png',
    },
    {
      id: 'jean',
      firstName: 'Jean',
      displayName: 'Jean M.',
      stageLabel: 'Stade modéré',
      avatarUrl: 'assets/patients/Jean.png',
    },
    {
      id: 'paul',
      firstName: 'Paul',
      displayName: 'Paul R.',
      stageLabel: 'Stade léger',
      avatarUrl: 'assets/patients/Paul.png',
    },
  ];

  private readonly builtInProfiles: Record<PatientId, PatientProfile> = {
    marcel: {
      patientId: 'marcel',
      stage: 'avance',
      vision: 'modere',
      motor: 'modere',
      themes: ['famille', 'quotidien'],
      attentionSpanMinutes: 5,
      difficulty: 'facile',
      questionCount: 5,
      answerCount: 2,
      hintDelaySeconds: 10,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      updatedAt: null,
    },
    jean: {
      patientId: 'jean',
      stage: 'modere',
      vision: 'leger',
      motor: 'leger',
      themes: ['quotidien', 'musique'],
      attentionSpanMinutes: 10,
      difficulty: 'moyen',
      questionCount: 10,
      answerCount: 3,
      hintDelaySeconds: 20,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      updatedAt: null,
    },
    paul: {
      patientId: 'paul',
      stage: 'leger',
      vision: 'leger',
      motor: 'leger',
      themes: ['enfance', 'lieux'],
      attentionSpanMinutes: 15,
      difficulty: 'difficile',
      questionCount: 15,
      answerCount: 4,
      hintDelaySeconds: 30,
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      updatedAt: null,
    },
  };

  private customPatients: PatientSummary[] = [];
  private customProfiles: Record<PatientId, PatientProfile> = {};
  private managedProfiles: ManagedProfile[] = [];
  private familyPatientAssociations: FamilyPatientAssociation[] = [];

  constructor(private readonly storage: StorageService) {
    this.loadFromStorage();
  }

  getPatients(): PatientSummary[] {
    return [...this.builtInPatients, ...this.customPatients].map((p) => ({ ...p }));
  }

  getManagedProfiles(): ManagedProfile[] {
    return [
      ...this.builtInPatients.map((patient) => this.mapPatientToManagedProfile(patient)),
      ...this.managedProfiles,
    ].map((profile) => ({ ...profile }));
  }

  getProfessionals(): ManagedProfile[] {
    return this.managedProfiles
      .filter((profile) => profile.type === 'professional')
      .map((profile) => ({ ...profile }));
  }

  getFamilyCaregivers(): ManagedProfile[] {
    return this.managedProfiles
      .filter((profile) => profile.type === 'family')
      .map((profile) => ({ ...profile }));
  }

  getPatientManagedProfiles(): ManagedProfile[] {
    return this.getManagedProfiles().filter((profile) => profile.type === 'patient');
  }

  getFamilyAssociations(familyId: string): FamilyPatientAssociation[] {
    return this.familyPatientAssociations
      .filter((association) => association.familyId === familyId)
      .map((association) => ({ ...association }));
  }

  getPatientAssociations(patientId: PatientId): FamilyPatientAssociation[] {
    return this.familyPatientAssociations
      .filter((association) => association.patientId === patientId)
      .map((association) => ({ ...association }));
  }

  getPatientsForFamily(familyId: string): PatientSummary[] {
    const patientIds = new Set(this.getFamilyAssociations(familyId).map((association) => association.patientId));
    return this.getPatients().filter((patient) => patientIds.has(patient.id));
  }

  addManagedProfile(profile: ManagedProfile, patientProfile?: PatientProfile): void {
    const index = this.managedProfiles.findIndex((entry) => entry.id === profile.id);
    if (index >= 0) {
      this.managedProfiles[index] = { ...profile };
    } else {
      this.managedProfiles.push({ ...profile });
    }

    if (profile.type === 'patient') {
      const summary: PatientSummary = {
        id: profile.id,
        firstName: profile.firstName,
        displayName: profile.displayName,
        stageLabel: profile.subtitle,
        avatarUrl: profile.avatarUrl,
      };
      this.addPatient(summary, patientProfile ?? this.createDefaultPatientProfile(profile));
      return;
    }

    this.saveToStorage();
  }

  removeManagedProfile(profileId: string): void {
    const profile = this.getManagedProfiles().find((entry) => entry.id === profileId);
    if (!profile) return;

    if (profile.type === 'patient') {
      this.removePatient(profileId);
    }

    this.managedProfiles = this.managedProfiles
      .filter((entry) => entry.id !== profileId)
      .map((entry) => entry.createdByProfessionalId === profileId ? { ...entry, createdByProfessionalId: undefined } : entry);

    this.familyPatientAssociations = this.familyPatientAssociations.filter((association) => (
      association.familyId !== profileId && association.patientId !== profileId
    ));

    this.saveToStorage();
  }

  setFamilyPatientAssociations(familyId: string, patientIds: PatientId[]): void {
    const nextIds = new Set(patientIds);
    this.familyPatientAssociations = [
      ...this.familyPatientAssociations.filter((association) => association.familyId !== familyId),
      ...Array.from(nextIds).map((patientId) => ({ familyId, patientId })),
    ];
    this.saveToStorage();
  }

  setPatientFamilyAssociations(patientId: PatientId, familyIds: string[]): void {
    const nextIds = new Set(familyIds);
    this.familyPatientAssociations = [
      ...this.familyPatientAssociations.filter((association) => association.patientId !== patientId),
      ...Array.from(nextIds).map((familyId) => ({ familyId, patientId })),
    ];
    this.saveToStorage();
  }

  getPatientById(patientId: PatientId): PatientSummary {
    const all = [...this.builtInPatients, ...this.customPatients];
    return { ...(all.find((p) => p.id === patientId) ?? all[0]) };
  }

  addPatient(summary: PatientSummary, profile: PatientProfile): void {
    const idx = this.customPatients.findIndex((p) => p.id === summary.id);
    if (idx >= 0) {
      this.customPatients[idx] = { ...summary };
    } else {
      this.customPatients.push({ ...summary });
    }
    this.customProfiles[summary.id] = { ...profile, themes: [...profile.themes] };
    this.saveToStorage();
  }

  removePatient(patientId: PatientId): void {
    // Allow deletion of built-in patients
    this.customPatients = this.customPatients.filter((p) => p.id !== patientId);
    delete this.customProfiles[patientId];
    
    // Also remove from built-in if it matches
    const builtInIndex = this.builtInPatients.findIndex((p) => p.id === patientId);
    if (builtInIndex >= 0) {
      this.builtInPatients.splice(builtInIndex, 1);
      delete this.builtInProfiles[patientId];
    }
    
    this.saveToStorage();
  }

  getDefaultProfile(patientId: PatientId): PatientProfile {
    const builtIn = this.builtInProfiles[patientId];
    if (builtIn) return { ...builtIn, themes: [...builtIn.themes] };
    const custom = this.customProfiles[patientId];
    if (custom) return { ...custom, themes: [...custom.themes] };
    const fallback = this.builtInProfiles['marcel'];
    return { ...fallback, patientId, themes: [...fallback.themes] };
  }

  private loadFromStorage(): void {
    this.customPatients = this.storage.getLocalItem<PatientSummary[]>(CUSTOM_PATIENTS_KEY) ?? [];
    this.customProfiles = this.storage.getLocalItem<Record<PatientId, PatientProfile>>(CUSTOM_PROFILES_KEY) ?? {};
    this.managedProfiles = this.storage.getLocalItem<ManagedProfile[]>(MANAGED_PROFILES_KEY) ?? [];
    this.familyPatientAssociations = this.storage.getLocalItem<FamilyPatientAssociation[]>(FAMILY_PATIENT_ASSOCIATIONS_KEY) ?? [];
  }

  private saveToStorage(): void {
    this.storage.setLocalItem(CUSTOM_PATIENTS_KEY, this.customPatients);
    this.storage.setLocalItem(CUSTOM_PROFILES_KEY, this.customProfiles);
    this.storage.setLocalItem(MANAGED_PROFILES_KEY, this.managedProfiles);
    this.storage.setLocalItem(FAMILY_PATIENT_ASSOCIATIONS_KEY, this.familyPatientAssociations);
  }

  private mapPatientToManagedProfile(patient: PatientSummary): ManagedProfile {
    return {
      id: patient.id,
      type: 'patient',
      firstName: patient.firstName,
      lastName: patient.displayName.replace(patient.firstName, '').trim(),
      displayName: patient.displayName,
      subtitle: patient.stageLabel,
      avatarUrl: patient.avatarUrl,
    };
  }

  private createDefaultPatientProfile(profile: ManagedProfile): PatientProfile {
    const stage = profile.stage ?? 'leger';
    const preset = stage === 'avance'
      ? { difficulty: 'facile' as const, questionCount: 5, answerCount: 2, hintDelaySeconds: 10, attentionSpanMinutes: 5 as const }
      : stage === 'modere'
        ? { difficulty: 'moyen' as const, questionCount: 10, answerCount: 3, hintDelaySeconds: 20, attentionSpanMinutes: 10 as const }
        : { difficulty: 'difficile' as const, questionCount: 15, answerCount: 4, hintDelaySeconds: 30, attentionSpanMinutes: 15 as const };

    return {
      patientId: profile.id,
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
  }
}
