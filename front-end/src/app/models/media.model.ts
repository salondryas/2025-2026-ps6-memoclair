import { PatientId } from './patient.model';

export type MediaKind = 'image' | 'audio';
export type MemoryCueType = 'location' | 'person' | 'event' | 'music' | 'object';

export interface MediaItem {
  id: string;
  patientId: PatientId;
  title: string;
  kind: MediaKind;
  fileName: string;
  originalName?: string;
  mimeType?: string;
  cueType: MemoryCueType;
  clinicalNote: string;
  createdAt: string;
  source: 'mock-upload' | 'seeded' | 'upload';
}

export interface CreateMediaItemPayload {
  patientId: PatientId;
  title: string;
  kind: MediaKind;
  fileName: string;
  cueType: MemoryCueType;
  clinicalNote: string;
}

export interface DeleteMediaResponseDto {
  success: boolean;
}

export interface MediaApiErrorDto {
  error: string;
}
