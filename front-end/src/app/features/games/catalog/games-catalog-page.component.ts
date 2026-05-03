import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { GameCatalogService } from '../services/game-catalog.service';
import { Game } from 'src/app/models/game.model';

@Component({
  selector: 'app-games-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './games-catalog-page.component.html',
  styleUrls: ['./games-catalog-page.component.scss'],
})
export class GamesCatalogPageComponent {
  patientName$ = this.patientContext.activePatient$;

  games: Game[] = this.catalog.getGames();

  // valeurs affichées
  stageLabel = '...';
  attentionMinutes = 5;
  themeLabel = '...';

  recoTitle = '';
  recoText = '';
  recommendedGameId: Game['id'] | null = null;

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly catalog: GameCatalogService
  ) {
    const patient = this.patientContext.getActivePatientSnapshot(); // PatientSummary
    const profile = this.catalog.getDefaultProfileForPatient(patient.firstName);

    this.stageLabel = this.catalog.getStageLabel(profile.stage);
    this.attentionMinutes = profile.attentionMinutes;
    this.themeLabel = profile.themes.join(', ');

    const reco = this.catalog.getRecommendation(profile);
    this.recoTitle = reco.title;
    this.recoText = reco.text;
    this.recommendedGameId = reco.recommendedGameId;
  }

  duoMode = false;

  isRecommended(game: Game): boolean {
    return this.recommendedGameId === game.id;
  }

  isDuoEnabledFor(game: Game): boolean {
    return game.id === 'game-b' && this.duoMode;
  }

  getIcon(id: Game['id']): string {
    switch (id) {
      case 'game-a':   return '🏠';
      case 'game-b':   return '💭';
      case 'game-duo': return '🤝';
    }
  }

  getGameRoute(game: Game): string {
    if (this.isDuoEnabledFor(game)) return '/games/game-duo';
    return game.route;
  }

  getPrimaryActionLabel(game: Game): string {
    if (this.isDuoEnabledFor(game)) return '👥 Jouer en duo';
    if (this.isRecommended(game)) return '⭐ Lancer';
    return 'Lancer';
  }
}
