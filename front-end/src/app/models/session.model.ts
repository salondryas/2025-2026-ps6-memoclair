import { PatientId } from './patient.model';

export type SessionGameType = 'game-a' | 'game-b' | 'game-duo';
export type SupportLevel = 'leger' | 'modere' | 'important';
export type EmotionalState = 'apaise' | 'engage' | 'variable' | 'fatigue';

export interface SessionObservation {
  hintCount: number;
  guidedMoments: number;
  skippedMoments: number;
  wrongAnswers: number;
  earlyStop: boolean;
  averageLatencySeconds: number;
  supportLevel: SupportLevel;
  emotionalState: EmotionalState;
}

export interface SessionResult {
  id: string;
  patientId: PatientId;
  gameType: SessionGameType;
  startedAt: string;
  durationMinutes: number;
  summary: string;
  observation: SessionObservation;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
}
