import { PatientId } from './patient.model';

export type GameBPromptSource = 'personal' | 'generic';

export interface GameBChoice {
  id: string;
  label: string;
  /** Mots repères pour rapprochement sémantique (jamais affichés au patient). */
  anchorWords: string[];
}

export interface GameBPrompt {
  id: string;
  source: GameBPromptSource;
  mediaItemId?: string;
  headline: string;
  patientLine: string;
  supportLabel: string;
  supportEmoji: string;
  choices: GameBChoice[];
  /** Relances discrètes pour l’aidant (ordre de lecture conseillé). */
  relances: string[];
  /** Agrégat pour validation aphasique sur saisie libre. */
  consolidatedKeywords: string[];
}

export interface GameBSessionState {
  patientId: PatientId;
  prompts: GameBPrompt[];
  promptIndex: number;
  relanceIndex: number;
  patientMessage: string | null;
  lastChoiceId: string | null;
  lastFreeText: string | null;
  caregiverValidated: boolean;
  skippedCount: number;
}
