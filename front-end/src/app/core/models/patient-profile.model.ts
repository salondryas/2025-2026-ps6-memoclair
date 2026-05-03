export interface PatientProfile {
  id: string;
  name: string;
  stage: 'leger' | 'modere' | 'avance';
  visualImpairments: boolean;
  motorDifficulties: boolean;
  themes: string[];
  maxAttentionMinutes: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameMetrics {
  sessionId: string;
  patientId: string;
  startTime: Date;
  currentQuestionIndex: number;
  totalQuestions: number;
  responses: ResponseMetric[];
  adaptations: AdaptationEvent[];
  sessionDuration: number;
  abandonmentTime?: Date;
}

export interface ResponseMetric {
  questionId: string;
  responseTime: number; // en millisecondes
  touchVariability: number; // écart-type des temps entre touches
  response: 'correct' | 'incorrect' | 'timeout' | 'abandoned';
  hintsUsed: number;
  difficultyLevel: number;
}

export interface AdaptationEvent {
  timestamp: Date;
  type: 'simplification' | 'hint' | 'timeout' | 'touch_adjustment';
  reason: string;
  previousDifficulty: number;
  newDifficulty: number;
}

export interface GameQuestion {
  id: string;
  type: 'person_recognition' | 'era_identification' | 'song_association' | 'object_memory';
  content: {
    mainImage?: string;
    audioFile?: string;
    question: string;
    options: GameOption[];
    theme?: string;
    era?: string;
  };
  difficulty: number; // 1-3
  personalized: boolean;
}

export interface GameOption {
  id: string;
  text: string;
  image?: string;
  audio?: string;
  isCorrect: boolean;
}

export interface DuoSession {
  isActive: boolean;
  caregiverId?: string;
  caregiverSuggestions: CaregiverSuggestion[];
  sharedScreen: boolean;
}

export interface CaregiverSuggestion {
  id: string;
  questionId: string;
  type: 'prompt' | 'hint' | 'encouragement';
  text: string;
  timing: 'immediate' | 'delayed';
}
