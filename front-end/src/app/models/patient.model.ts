export type PatientId = string;

export type ClinicalStage = 'leger' | 'modere' | 'avance';
export type VisionLevel = 'leger' | 'modere' | 'important';
export type MotorLevel = 'leger' | 'modere' | 'important';
export type ThemeTag = 'famille' | 'quotidien' | 'musique' | 'enfance' | 'metier' | 'lieux';
export type GameDifficulty = 'facile' | 'moyen' | 'difficile' | 'personnalise';

export interface PatientSummary {
  id: PatientId;
  firstName: string;
  displayName: string;
  stageLabel: string;
  avatarUrl?: string;
}

export interface PatientProfile {
  patientId: PatientId;
  stage: ClinicalStage;
  vision: VisionLevel;
  motor: MotorLevel;
  themes: ThemeTag[];
  attentionSpanMinutes: 5 | 10 | 15 | 20;

  // New fields
  difficulty: GameDifficulty;
  questionCount: number;
  answerCount: number;
  hintDelaySeconds: number;
  audioReadingEnabled: boolean;
  highContrastEnabled: boolean;
  textSize: number; // 1 = normal, 1.5 = large, etc.

  updatedAt: string | null;
}

export interface SelectOption<TValue extends string | number> {
  value: TValue;
  label: string;
}

export const DIFFICULTY_PRESETS: Record<Exclude<GameDifficulty, 'personnalise'>, Pick<PatientProfile, 'questionCount' | 'answerCount' | 'hintDelaySeconds'>> = {
  facile: {
    questionCount: 5,
    answerCount: 2,
    hintDelaySeconds: 10,
  },
  moyen: {
    questionCount: 10,
    answerCount: 3,
    hintDelaySeconds: 20,
  },
  difficile: {
    questionCount: 15,
    answerCount: 4,
    hintDelaySeconds: 30,
  },
};

export const STAGE_OPTIONS: ReadonlyArray<SelectOption<ClinicalStage>> = [
  { value: 'leger', label: 'Léger' },
  { value: 'modere', label: 'Modéré' },
  { value: 'avance', label: 'Avancé' },
];

export const VISION_OPTIONS: ReadonlyArray<SelectOption<VisionLevel>> = [
  { value: 'leger', label: 'Légers' },
  { value: 'modere', label: 'Modérés' },
  { value: 'important', label: 'Importants' },
];

export const MOTOR_OPTIONS: ReadonlyArray<SelectOption<MotorLevel>> = [
  { value: 'leger', label: 'Légères' },
  { value: 'modere', label: 'Modérées' },
  { value: 'important', label: 'Importantes' },
];

export const ATTENTION_OPTIONS: ReadonlyArray<SelectOption<PatientProfile['attentionSpanMinutes']>> = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
];

export const THEME_OPTIONS: ReadonlyArray<SelectOption<ThemeTag>> = [
  { value: 'famille', label: 'Famille' },
  { value: 'quotidien', label: 'Quotidien' },
  { value: 'musique', label: 'Musique' },
  { value: 'enfance', label: 'Enfance' },
  { value: 'metier', label: 'Métier' },
  { value: 'lieux', label: 'Lieux connus' },
];
