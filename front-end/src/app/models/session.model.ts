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

export interface SessionChoiceDto {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface GameBQuestionDto {
  id: string;
  mediaType: 'image' | 'audio';
  imageSrc?: string;
  audioSrc?: string;
  question: string;
  source: string;
  caption: string;
  hint: string;
  choices: SessionChoiceDto[];
}

export interface GameBGenerateRequestDto {
  patientName: string;
}

export interface GameBGenerateResponseDto {
  questions: GameBQuestionDto[];
  fromCache?: boolean;
}

export interface GameBGenerateErrorDto {
  error: string;
  questions?: GameBQuestionDto[];
}

export interface DuoRoundDto {
  mediaType: 'image' | 'audio';
  mediaSrc: string;
  mediaAlt: string;
  mediaCaption: string;
  question: string;
  helper: string;
  choicesAidant: string[];
  choicesAccueilli: string[];
  correctIndex: number;
  feedbackCorrect: string;
}

export interface DuoGenerateRequestDto {
  patientName: string;
}

export interface DuoGenerateResponseDto {
  rounds: DuoRoundDto[];
  fromCache?: boolean;
}

export interface DuoNotEnoughMediaErrorDto {
  error: 'not_enough_media';
  message: string;
  count: number;
}

export interface DuoGenerateErrorDto {
  error: string;
  message?: string;
  count?: number;
}
