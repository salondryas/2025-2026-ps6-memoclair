import { Injectable } from '@angular/core';

import { Game, GameId } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameRepositoryMock {
  private readonly games: Game[] = [
    {
      id: 'game-a',
      title: 'Associations du quotidien',
      description: "Repérez des objets familiers, leur contexte naturel et l'ordre d'une petite routine.",
      focus: 'Mémoire sémantique et procédurale',
      duration: '5 à 8 min',
      memoryAxis: 'Objets, contexte, séquence',
      bullets: ['Objets du quotidien', 'Choix concrets', "Routine remise dans l'ordre"],
      route: '/games/game-a',
    },
    {
      id: 'game-b',
      title: 'Mémoire & Réminiscence',
      description: 'Laissez revenir une personne, un lieu, une ambiance ou une émotion à partir de souvenirs personnels.',
      focus: 'Mémoire autobiographique ancienne',
      duration: '5 à 10 min',
      memoryAxis: 'Souvenirs, émotions, conversation',
      bullets: ['Supports personnels ou génériques', 'Relances progressives', 'Mode duo accompagné'],
      route: '/games/game-b',
      duo: true,
    },
    {
      id: 'game-duo',
      title: 'Mode Duo',
      description: "Jouer ensemble : l'aidant et le patient partagent leurs souvenirs.",
      focus: 'Lien social & mémoire partagée',
      duration: '10 à 15 min',
      memoryAxis: 'Dialogue, validation mutuelle, souvenir partagé',
      bullets: ['Décision à deux', 'Validation conjointe', 'Renforcement du lien'],
      route: '/games/game-duo',
      duo: true,
    },
  ];

  getGames(): Game[] {
    return this.games.map((game) => ({ ...game, bullets: [...game.bullets] }));
  }

  getGameById(id: GameId): Game | undefined {
    const game = this.games.find((entry) => entry.id === id);
    return game ? { ...game, bullets: [...game.bullets] } : undefined;
  }
}
