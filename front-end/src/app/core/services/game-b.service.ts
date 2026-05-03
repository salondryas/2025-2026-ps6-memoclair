import { Injectable, signal } from '@angular/core';
import { PatientProfile, GameQuestion, GameMetrics, ResponseMetric, AdaptationEvent, DuoSession, CaregiverSuggestion } from '../models/patient-profile.model';

@Injectable({
  providedIn: 'root'
})
export class GameBService {
  private currentPatient = signal<PatientProfile | null>(null);
  private currentMetrics = signal<GameMetrics | null>(null);
  private currentQuestion = signal<GameQuestion | null>(null);
  private duoSession = signal<DuoSession>({ isActive: false, caregiverSuggestions: [], sharedScreen: false });
  
  // Banques de données génériques
  private genericImages = [
    { id: '1', url: 'assets/images/generic/family-1950.jpg', era: '1950s', theme: 'famille' },
    { id: '2', url: 'assets/images/generic/radio-1960.jpg', era: '1960s', theme: 'musique' },
    { id: '3', url: 'assets/images/generic/kitchen-1970.jpg', era: '1970s', theme: 'quotidien' },
    { id: '4', url: 'assets/images/generic/car-1980.jpg', era: '1980s', theme: 'transport' },
    { id: '5', url: 'assets/images/generic/phone-1990.jpg', era: '1990s', theme: 'communication' }
  ];

  private genericSongs = [
    { id: '1', title: 'La Vie en Rose', artist: 'Édith Piaf', era: '1940s', file: 'assets/audio/la-vie-en-rose.mp3' },
    { id: '2', title: 'Le Temps des Cerises', artist: 'Traditionnel', era: '1860s', file: 'assets/audio/temps-cerises.mp3' },
    { id: '3', title: 'Ne me quitte pas', artist: 'Jacques Brel', era: '1950s', file: 'assets/audio/ne-me-quitte-pas.mp3' }
  ];

  constructor() {}

  // Configuration du profil patient
  setPatientProfile(profile: PatientProfile): void {
    this.currentPatient.set(profile);
  }

  getCurrentPatient(): PatientProfile | null {
    return this.currentPatient();
  }

  // Génération des questions adaptées
  generateAdaptiveQuestions(count: number = 10): GameQuestion[] {
    const profile = this.currentPatient();
    if (!profile) return [];

    const questions: GameQuestion[] = [];
    const baseDifficulty = this.getDifficultyFromStage(profile.stage);

    for (let i = 0; i < count; i++) {
      const question = this.createQuestion(baseDifficulty, profile.themes, i);
      questions.push(question);
    }

    return this.orderQuestionsByDifficulty(questions);
  }

  private getDifficultyFromStage(stage: string): number {
    switch (stage) {
      case 'leger': return 3; // Plus grande difficulté pour stade léger
      case 'modere': return 2;
      case 'avance': return 1; // Plus facile pour stade avancé
      default: return 2;
    }
  }

  private createQuestion(baseDifficulty: number, themes: string[], index: number): GameQuestion {
    const questionTypes: GameQuestion['type'][] = ['person_recognition', 'era_identification', 'song_association', 'object_memory'];
    const type = questionTypes[index % questionTypes.length];
    
    const personalized = Math.random() > 0.3; // 70% de chances d'avoir du contenu personnalisé
    
    return {
      id: `q_${Date.now()}_${index}`,
      type,
      difficulty: this.adjustDifficulty(baseDifficulty, index),
      personalized,
      content: this.generateQuestionContent(type, themes, personalized)
    };
  }

  private generateQuestionContent(type: GameQuestion['type'], themes: string[], personalized: boolean) {
    switch (type) {
      case 'person_recognition':
        return this.generatePersonRecognitionQuestion(themes, personalized);
      case 'era_identification':
        return this.generateEraIdentificationQuestion(themes, personalized);
      case 'song_association':
        return this.generateSongAssociationQuestion(themes, personalized);
      case 'object_memory':
        return this.generateObjectMemoryQuestion(themes, personalized);
      default:
        return this.generatePersonRecognitionQuestion(themes, personalized);
    }
  }

  private generatePersonRecognitionQuestion(themes: string[], personalized: boolean) {
    if (personalized && themes.includes('famille')) {
      // Contenu personnalisé avec photos de famille
      return {
        question: 'Qui est sur cette photo ?',
        options: [
          { id: 'opt1', text: 'Papa', image: 'assets/images/family/pere.jpg', isCorrect: true },
          { id: 'opt2', text: 'Oncle', image: 'assets/images/family/oncle.jpg', isCorrect: false },
          { id: 'opt3', text: 'Voisin', image: 'assets/images/family/voisin.jpg', isCorrect: false }
        ],
        theme: 'famille'
      };
    } else {
      // Contenu générique
      const image = this.genericImages[Math.floor(Math.random() * this.genericImages.length)];
      return {
        question: 'À quelle époque cette image vous fait-elle penser ?',
        mainImage: image.url,
        options: [
          { id: 'opt1', text: 'Années 1950', isCorrect: image.era === '1950s' },
          { id: 'opt2', text: 'Années 1970', isCorrect: image.era === '1970s' },
          { id: 'opt3', text: 'Années 1990', isCorrect: image.era === '1990s' }
        ],
        theme: image.theme,
        era: image.era
      };
    }
  }

  private generateEraIdentificationQuestion(themes: string[], personalized: boolean) {
    const object = this.genericImages[Math.floor(Math.random() * this.genericImages.length)];
    return {
      question: 'Quel objet typique de cette époque est représenté ?',
      mainImage: object.url,
      options: [
        { id: 'opt1', text: 'Téléphone à cadran', isCorrect: object.era === '1950s' },
        { id: 'opt2', text: 'Téléphone portable', isCorrect: false },
        { id: 'opt3', text: 'Radio à transistors', isCorrect: object.era === '1960s' }
      ],
      theme: object.theme,
      era: object.era
    };
  }

  private generateSongAssociationQuestion(themes: string[], personalized: boolean) {
    const song = this.genericSongs[Math.floor(Math.random() * this.genericSongs.length)];
    return {
      question: 'Cette chanson vous rappelle-t-elle quelque chose ?',
      audioFile: song.file,
      options: [
        { id: 'opt1', text: 'Les bals du samedi soir', isCorrect: true },
        { id: 'opt2', text: 'Les offices religieux', isCorrect: false },
        { id: 'opt3', text: 'Les repas en famille', isCorrect: false }
      ],
      theme: 'musique',
      era: song.era
    };
  }

  private generateObjectMemoryQuestion(themes: string[], personalized: boolean) {
    return {
      question: 'Quel objet utilisiez-vous le plus souvent ?',
      options: [
        { id: 'opt1', text: 'Machine à laver', image: 'assets/images/objects/machine-a-laver.jpg', isCorrect: true },
        { id: 'opt2', text: 'Lave-vaisselle', image: 'assets/images/objects/lave-vaisselle.jpg', isCorrect: false },
        { id: 'opt3', text: 'Réfrigérateur', image: 'assets/images/objects/refrigerateur.jpg', isCorrect: false }
      ],
      theme: 'quotidien'
    };
  }

  private adjustDifficulty(baseDifficulty: number, questionIndex: number): number {
    // Variation progressive de la difficulté
    const variation = Math.floor(questionIndex / 3);
    return Math.max(1, Math.min(3, baseDifficulty + variation));
  }

  private orderQuestionsByDifficulty(questions: GameQuestion[]): GameQuestion[] {
    return questions.sort((a, b) => a.difficulty - b.difficulty);
  }

  // Métriques comportementales
  startSession(patientId: string): GameMetrics {
    const metrics: GameMetrics = {
      sessionId: `session_${Date.now()}`,
      patientId,
      startTime: new Date(),
      currentQuestionIndex: 0,
      totalQuestions: 10,
      responses: [],
      adaptations: [],
      sessionDuration: 0
    };
    
    this.currentMetrics.set(metrics);
    return metrics;
  }

  recordResponse(response: ResponseMetric): void {
    const metrics = this.currentMetrics();
    if (metrics) {
      metrics.responses.push(response);
      this.analyzeAndAdapt(response);
    }
  }

  private analyzeAndAdapt(response: ResponseMetric): void {
    const profile = this.currentPatient();
    if (!profile) return;

    const adaptations: AdaptationEvent[] = [];

    // Analyse du temps de latence (>8s = surcharge)
    if (response.responseTime > 8000) {
      adaptations.push({
        timestamp: new Date(),
        type: 'simplification',
        reason: 'Temps de réponse > 8s - surcharge cognitive détectée',
        previousDifficulty: response.difficultyLevel,
        newDifficulty: Math.max(1, response.difficultyLevel - 1)
      });
    }

    // Analyse de la variabilité des touches
    if (response.touchVariability > 1000) {
      adaptations.push({
        timestamp: new Date(),
        type: 'touch_adjustment',
        reason: 'Variabilité tactile élevée - ajustement des cibles',
        previousDifficulty: response.difficultyLevel,
        newDifficulty: response.difficultyLevel
      });
    }

    // Analyse des indices utilisés
    if (response.hintsUsed > 2) {
      adaptations.push({
        timestamp: new Date(),
        type: 'simplification',
        reason: 'Indices multiples utilisés - recalibrage nécessaire',
        previousDifficulty: response.difficultyLevel,
        newDifficulty: Math.max(1, response.difficultyLevel - 1)
      });
    }

    const metrics = this.currentMetrics();
    if (metrics) {
      metrics.adaptations.push(...adaptations);
    }
  }

  // Mode Duo
  enableDuoMode(caregiverId?: string): void {
    this.duoSession.set({
      isActive: true,
      caregiverId,
      caregiverSuggestions: [],
      sharedScreen: true
    });
  }

  generateCaregiverSuggestion(question: GameQuestion, patientResponse: ResponseMetric): CaregiverSuggestion {
    const suggestions: CaregiverSuggestion[] = [];

    if (patientResponse.responseTime > 5000) {
      suggestions.push({
        id: `sug_${Date.now()}_1`,
        questionId: question.id,
        type: 'prompt',
        text: 'Demande-lui si ça lui rappelle quelque chose',
        timing: 'immediate'
      });
    }

    if (patientResponse.hintsUsed === 0 && patientResponse.responseTime > 3000) {
      suggestions.push({
        id: `sug_${Date.now()}_2`,
        questionId: question.id,
        type: 'hint',
        text: 'Laisse-lui le temps de réfléchir',
        timing: 'delayed'
      });
    }

    if (question.type === 'person_recognition') {
      suggestions.push({
        id: `sug_${Date.now()}_3`,
        questionId: question.id,
        type: 'encouragement',
        text: 'Tu peux lui montrer les détails de la photo',
        timing: 'immediate'
      });
    }

    return suggestions[0]; // Retourne la suggestion la plus pertinente
  }

  // Getters
  getCurrentMetrics(): GameMetrics | null {
    return this.currentMetrics();
  }

  getCurrentQuestion(): GameQuestion | null {
    return this.currentQuestion();
  }

  setCurrentQuestion(question: GameQuestion): void {
    this.currentQuestion.set(question);
  }

  getDuoSession(): DuoSession {
    return this.duoSession();
  }

  endSession(): void {
    const metrics = this.currentMetrics();
    if (metrics) {
      metrics.sessionDuration = Date.now() - metrics.startTime.getTime();
      this.currentMetrics.set(null);
    }
    this.currentQuestion.set(null);
    this.duoSession.set({ isActive: false, caregiverSuggestions: [], sharedScreen: false });
  }
}
