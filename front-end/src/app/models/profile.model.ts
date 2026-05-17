import { ClinicalStage, PatientId } from './patient.model';

export type ManagedProfileType = 'professional' | 'patient' | 'family';

export interface ManagedProfile {
  id: string;
  type: ManagedProfileType;
  firstName: string;
  lastName: string;
  displayName: string;
  subtitle: string;
  avatarUrl?: string;
  createdByProfessionalId?: string;
  stage?: ClinicalStage;
  jobTitle?: string;
  organization?: string;
  relationship?: string;
  email?: string;
  phone?: string;
}

export interface FamilyPatientAssociation {
  familyId: string;
  patientId: PatientId;
}

export interface ManagedProfileDraft {
  type: ManagedProfileType;
  firstName: string;
  lastName: string;
  stage: ClinicalStage | '';
  avatarUrl: string;
  jobTitle: string;
  organization: string;
  relationship: string;
  email: string;
  phone: string;
  associatedPatientIds: PatientId[];
  associatedFamilyIds: string[];
}
