import { Injectable } from '@angular/core';

import { PatientId, PatientProfile, PatientSummary } from '../models/patient.model';
import { StorageService } from '../core/services/storage.service';

const CUSTOM_PATIENTS_KEY = 'mc_custom_patients';
const CUSTOM_PROFILES_KEY = 'mc_custom_profiles';

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

  constructor(private readonly storage: StorageService) {
    this.loadFromStorage();
  }

  getPatients(): PatientSummary[] {
    return [...this.builtInPatients, ...this.customPatients].map((p) => ({ ...p }));
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
    if (BUILT_IN_IDS.includes(patientId)) return;
    this.customPatients = this.customPatients.filter((p) => p.id !== patientId);
    delete this.customProfiles[patientId];
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
  }

  private saveToStorage(): void {
    this.storage.setLocalItem(CUSTOM_PATIENTS_KEY, this.customPatients);
    this.storage.setLocalItem(CUSTOM_PROFILES_KEY, this.customProfiles);
  }
}
