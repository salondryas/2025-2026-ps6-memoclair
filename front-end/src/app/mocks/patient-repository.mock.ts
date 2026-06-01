import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { DEFAULT_PROFILE_OBJECTIVES, PatientId, PatientProfile, PatientSummary } from '../models/patient.model';
import { FamilyPatientAssociation, ManagedProfile } from '../models/profile.model';
import { StorageService } from '../core/services/storage.service';
import { environment } from '../../environments/environment';

const CUSTOM_PATIENTS_KEY = 'mc_custom_patients';
const CUSTOM_PROFILES_KEY = 'mc_custom_profiles';
const MANAGED_PROFILES_KEY = 'mc_managed_profiles';
const FAMILY_PATIENT_ASSOCIATIONS_KEY = 'mc_family_patient_associations';

const BUILT_IN_IDS = ['marcel', 'jean', 'paul'];

type BackendProfileType = 'professional' | 'patient' | 'family';
type BackendProfileStage = 'leger' | 'modere' | 'avance' | null;

interface BackendProfileDto {
  id: string;
  type: BackendProfileType;
  firstName: string;
  lastName: string;
  displayName?: string;
  createdByProfessionalId?: string | null;
  stage?: BackendProfileStage;
  jobTitle?: string | null;
  organization?: string | null;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class PatientRepositoryMock {
  private readonly profilesApiUrl = `${environment.backendUrl}/api/profiles`;
  private readonly associationsApiUrl = `${environment.backendUrl}/api/associations`;

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
      autoNextMode: '5s',
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES },
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
      autoNextMode: '5s',
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES },
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
      autoNextMode: '5s',
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES },
      updatedAt: null,
    },
  };

  private customPatients: PatientSummary[] = [];
  private customProfiles: Record<PatientId, PatientProfile> = {};
  private managedProfiles: ManagedProfile[] = [];
  private familyPatientAssociations: FamilyPatientAssociation[] = [];

  constructor(
    private readonly storage: StorageService,
    private readonly http: HttpClient,
  ) {
    this.loadFromStorage();
    this.syncManagedDataFromBackend();
  }

  getPatients(): PatientSummary[] {
    return [...this.builtInPatients, ...this.customPatients].map((p) => ({ ...p }));
  }

  getManagedProfiles(): ManagedProfile[] {
    const remoteManagedProfiles = this.managedProfiles.filter(
      (profile) => !(profile.type === 'patient' && BUILT_IN_IDS.includes(profile.id)),
    );

    return [
      ...this.builtInPatients.map((patient) => this.mapPatientToManagedProfile(patient)),
      ...remoteManagedProfiles,
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
    const remotePatientProfiles = this.managedProfiles.filter(
      (profile) => profile.type === 'patient' && !BUILT_IN_IDS.includes(profile.id),
    );

    return [
      ...this.builtInPatients.map((patient) => this.mapPatientToManagedProfile(patient)),
      ...remotePatientProfiles,
    ].map((profile) => ({ ...profile }));
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
    } else {
      this.saveToStorage();
    }

    this.http.post<BackendProfileDto>(this.profilesApiUrl, this.mapManagedProfileToBackendPayload(profile))
      .pipe(catchError(() => of(null)))
      .subscribe((backendProfile) => {
        if (!backendProfile) return;
        this.upsertManagedProfile(this.mapBackendProfileToManagedProfile(backendProfile));
        this.saveToStorage();
      });
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

    this.http.delete(`${this.profilesApiUrl}/${profileId}`)
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  setFamilyPatientAssociations(familyId: string, patientIds: PatientId[]): void {
    const nextIds = new Set(patientIds);
    this.familyPatientAssociations = [
      ...this.familyPatientAssociations.filter((association) => association.familyId !== familyId),
      ...Array.from(nextIds).map((patientId) => ({ familyId, patientId })),
    ];
    this.saveToStorage();

    this.http.put<FamilyPatientAssociation[]>(
      `${this.associationsApiUrl}/family/${familyId}/patients`,
      { patientIds },
    )
      .pipe(catchError(() => of(null)))
      .subscribe((associations) => {
        if (!associations) return;
        this.familyPatientAssociations = [
          ...this.familyPatientAssociations.filter((association) => association.familyId !== familyId),
          ...associations,
        ];
        this.saveToStorage();
      });
  }

  setPatientFamilyAssociations(patientId: PatientId, familyIds: string[]): void {
    const nextIds = new Set(familyIds);
    this.familyPatientAssociations = [
      ...this.familyPatientAssociations.filter((association) => association.patientId !== patientId),
      ...Array.from(nextIds).map((familyId) => ({ familyId, patientId })),
    ];
    this.saveToStorage();

    this.http.put<FamilyPatientAssociation[]>(
      `${this.associationsApiUrl}/patient/${patientId}/families`,
      { familyIds },
    )
      .pipe(catchError(() => of(null)))
      .subscribe((associations) => {
        if (!associations) return;
        this.familyPatientAssociations = [
          ...this.familyPatientAssociations.filter((association) => association.patientId !== patientId),
          ...associations,
        ];
        this.saveToStorage();
      });
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
    this.customProfiles[summary.id] = {
      ...profile,
      themes: [...profile.themes],
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES, ...profile.objectives },
    };
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
    if (builtIn) {
      return {
        ...builtIn,
        themes: [...builtIn.themes],
        objectives: { ...DEFAULT_PROFILE_OBJECTIVES, ...builtIn.objectives },
      };
    }
    const custom = this.customProfiles[patientId];
    if (custom) {
      return {
        ...custom,
        themes: [...custom.themes],
        objectives: { ...DEFAULT_PROFILE_OBJECTIVES, ...custom.objectives },
      };
    }
    const fallback = this.builtInProfiles['marcel'];
    return {
      ...fallback,
      patientId,
      themes: [...fallback.themes],
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES, ...fallback.objectives },
    };
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

  private syncManagedDataFromBackend(): void {
    forkJoin({
      profiles: this.http.get<BackendProfileDto[]>(this.profilesApiUrl).pipe(catchError(() => of(null))),
      associations: this.http.get<FamilyPatientAssociation[]>(this.associationsApiUrl).pipe(catchError(() => of(null))),
    }).subscribe(({ profiles, associations }) => {
      const hasRemoteProfiles = Array.isArray(profiles);
      const hasRemoteAssociations = Array.isArray(associations);
      if (!hasRemoteProfiles && !hasRemoteAssociations) {
        return;
      }

      if (hasRemoteProfiles) {
        this.managedProfiles = profiles.map((profile) => this.mapBackendProfileToManagedProfile(profile));
        this.customPatients = this.managedProfiles
          .filter((profile) => profile.type === 'patient' && !BUILT_IN_IDS.includes(profile.id))
          .map((profile) => ({
            id: profile.id,
            firstName: profile.firstName,
            displayName: profile.displayName,
            stageLabel: profile.subtitle,
            avatarUrl: profile.avatarUrl,
          }));
      }

      if (hasRemoteAssociations) {
        this.familyPatientAssociations = associations;
      }

      this.saveToStorage();
    });
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

  private mapBackendProfileToManagedProfile(profile: BackendProfileDto): ManagedProfile {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    const displayName = profile.displayName?.trim() || `${firstName} ${lastName}`.trim();

    const managedProfile: ManagedProfile = {
      id: profile.id,
      type: profile.type,
      firstName,
      lastName,
      displayName,
      subtitle: this.buildProfileSubtitle(profile),
      avatarUrl: profile.avatarUrl || undefined,
      createdByProfessionalId: profile.createdByProfessionalId || undefined,
      stage: profile.stage || undefined,
      jobTitle: profile.jobTitle || undefined,
      organization: profile.organization || undefined,
      relationship: profile.relationship || undefined,
      email: profile.email || undefined,
      phone: profile.phone || undefined,
    };

    return managedProfile;
  }

  private mapManagedProfileToBackendPayload(profile: ManagedProfile): Partial<BackendProfileDto> {
    return {
      id: profile.id,
      type: profile.type,
      firstName: profile.firstName,
      lastName: profile.lastName,
      createdByProfessionalId: profile.createdByProfessionalId || null,
      stage: profile.stage || null,
      jobTitle: profile.jobTitle || null,
      organization: profile.organization || null,
      relationship: profile.relationship || null,
      email: profile.email || null,
      phone: profile.phone || null,
      avatarUrl: profile.avatarUrl || null,
    };
  }

  private buildProfileSubtitle(profile: BackendProfileDto): string {
    if (profile.type === 'professional') {
      const title = profile.jobTitle?.trim() || 'Soignant';
      const organization = profile.organization?.trim();
      return organization ? `${title} · ${organization}` : title;
    }

    if (profile.type === 'patient') {
      if (profile.stage === 'modere') return 'Stade modéré';
      if (profile.stage === 'avance') return 'Stade avancé';
      return 'Stade léger';
    }

    const relationship = profile.relationship?.trim();
    return relationship ? `Aidant familial · ${relationship}` : 'Aidant familial';
  }

  private upsertManagedProfile(profile: ManagedProfile): void {
    const index = this.managedProfiles.findIndex((entry) => entry.id === profile.id);
    if (index >= 0) {
      this.managedProfiles[index] = profile;
      return;
    }
    this.managedProfiles.push(profile);
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
      autoNextMode: '5s',
      audioReadingEnabled: true,
      highContrastEnabled: false,
      textSize: 1,
      objectives: { ...DEFAULT_PROFILE_OBJECTIVES },
      updatedAt: null,
    };
  }
}
