import { Injectable } from '@angular/core';

import { PatientId, PatientProfile, PatientSummary } from '../models/patient.model';

@Injectable({
  providedIn: 'root',
})
export class PatientRepositoryMock {
  private readonly patients: PatientSummary[] = [
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

  private readonly defaultProfiles: Record<PatientId, PatientProfile> = {
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

  getPatients(): PatientSummary[] {
    return this.patients.map((patient) => ({ ...patient }));
  }

  getPatientById(patientId: PatientId): PatientSummary {
    const patient = this.patients.find((entry) => entry.id === patientId);

    if (!patient) {
      return this.patients[0];
    }

    return { ...patient };
  }

  addPatient(summary: PatientSummary, profile: PatientProfile): void {
    const existingIndex = this.patients.findIndex((entry) => entry.id === summary.id);
    const nextSummary = { ...summary };
    const nextProfile: PatientProfile = {
      ...profile,
      patientId: summary.id,
      themes: [...profile.themes],
    };

    if (existingIndex >= 0) {
      this.patients[existingIndex] = nextSummary;
    } else {
      this.patients.push(nextSummary);
    }

    this.defaultProfiles[summary.id] = nextProfile;
  }

  getDefaultProfile(patientId: PatientId): PatientProfile {
    const fallback = this.defaultProfiles['marcel'];
    const profile = this.defaultProfiles[patientId] ?? fallback;

    return {
      ...profile,
      themes: [...profile.themes],
    };
  }
}
