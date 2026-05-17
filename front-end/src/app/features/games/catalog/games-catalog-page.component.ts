import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { GameCatalogService } from '../services/game-catalog.service';
import { Game } from 'src/app/models/game.model';

type CatalogGameId = 'game-a' | 'game-b';
type CatalogGame = Game & { id: CatalogGameId };

@Component({
  selector: 'app-games-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './games-catalog-page.component.html',
  styleUrls: ['./games-catalog-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesCatalogPageComponent {
  private readonly patientContext = inject(PatientContextService);
  private readonly catalog = inject(GameCatalogService);

  readonly activePatient = toSignal(this.patientContext.activePatient$, {
    initialValue: this.patientContext.getActivePatientSnapshot(),
  });
  readonly patientFirstName = computed(() => this.activePatient()?.firstName ?? '...');
  readonly patientAvatarUrl = computed(
    () => this.activePatient()?.avatarUrl ?? 'assets/patients/Marcel.png',
  );

  readonly games: CatalogGame[] = this.catalog.getGames().filter((game): game is CatalogGame => {
    return game.id === 'game-a' || game.id === 'game-b';
  });
  readonly duoEnabledForGameB = signal(false);
  readonly recommendedGameId = computed(() => {
    const profile = this.catalog.getDefaultProfileForPatient(this.activePatient()?.firstName ?? null);
    return this.catalog.getRecommendation(profile).recommendedGameId;
  });

  getThumbnail(gameId: string): string {
    if (gameId === 'game-a') {
      return 'assets/games/game-a/thumbnails/cover.png';
    }
    if (gameId === 'game-b') {
      return 'assets/games/game-b/thumbnails/cover.png';
    }
    return '';
  }

  isDuoEnabledFor(game: CatalogGame): boolean {
    return game.id === 'game-b' && game.duo === true && this.duoEnabledForGameB();
  }

  showDuoToggleFor(game: CatalogGame): boolean {
    return game.id === 'game-b' && game.duo === true;
  }

  toggleDuoFor(game: CatalogGame): void {
    if (!this.showDuoToggleFor(game)) {
      return;
    }
    this.duoEnabledForGameB.update((enabled) => !enabled);
  }

  isRecommended(game: CatalogGame): boolean {
    return this.recommendedGameId() === game.id;
  }
}
