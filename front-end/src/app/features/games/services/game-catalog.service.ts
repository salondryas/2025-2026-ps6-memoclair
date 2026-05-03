import { Injectable } from '@angular/core';
import { Game, GameId } from 'src/app/models/game.model';
import { GameRepositoryMock } from '../../../mocks/game-repository.mock';

export type PatientStage = 'leger' | 'modere' | 'avance';

export interface PatientProfile {
  stage: PatientStage;
  themes: string[]; // ex: ['famille', 'musique']
  attentionMinutes: number; // ex: 5, 10, 15
}

export interface CatalogRecommendation {
  recommendedGameId: GameId;
  title: string;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class GameCatalogService {
  constructor(private readonly gameRepository: GameRepositoryMock) {}

  getGames(): Game[] {
    return this.gameRepository.getGames().filter((game) => game.id !== 'game-duo');
  }

  // Profil patient “simple” pour l’instant (issue #3+4 : on pourra stocker ça plus tard)
  // Ici on déduit à partir du nom (ou tu peux brancher sur un vrai formulaire après).
  getDefaultProfileForPatient(patientName: string | null): PatientProfile {
    const name = (patientName ?? '').toLowerCase();

    if (name === 'paul') {
      return { stage: 'leger', themes: ['musique', 'famille'], attentionMinutes: 15 };
    }
    if (name === 'jean') {
      return { stage: 'modere', themes: ['quotidien', 'famille'], attentionMinutes: 10 };
    }
    // marcel + fallback
    return { stage: 'avance', themes: ['quotidien'], attentionMinutes: 5 };
  }

  getRecommendation(profile: PatientProfile): CatalogRecommendation {
    const memoryThemes = new Set(['famille', 'musique', 'enfance', 'lieux']);
    const shouldRecommendMemory = profile.themes.some((t) => memoryThemes.has(t));

    if (shouldRecommendMemory) {
      return {
        recommendedGameId: 'game-b',
        title: 'Commencer par Mémoire & Réminiscence',
        text: "Les thèmes choisis aujourd’hui se prêtent bien à une conversation simple et apaisée, sans recherche de performance.",
      };
    }

    return {
      recommendedGameId: 'game-a',
      title: 'Commencer par Associations du quotidien',
      text: "Une entrée très concrète peut rassurer, installer le rythme et éviter toute mise en échec.",
    };
  }

  // Helpers UI
  getStageLabel(stage: PatientStage): string {
    switch (stage) {
      case 'leger':
        return 'Exploration plus riche';
      case 'modere':
        return 'Repères concrets et guidés';
      case 'avance':
        return 'Rythme très doux et repères forts';
    }
  }
}
