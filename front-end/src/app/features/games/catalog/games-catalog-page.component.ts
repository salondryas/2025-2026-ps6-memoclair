import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

import { environment } from '../../../../environments/environment';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { GameCatalogService } from '../services/game-catalog.service';
import { Game } from 'src/app/models/game.model';
import { RecommendedGameBadgeComponent } from '../../../shared/components/design-system/recommended-game-badge/recommended-game-badge.component';
import { BrandLogoComponent } from '../../../shared/components/brand-logo/brand-logo.component';

type CatalogGameId = 'game-a' | 'game-b';
type CatalogGame = Game & { id: CatalogGameId };

@Component({
  selector: 'app-games-catalog-page',
  standalone: true,
  imports: [CommonModule, RouterModule, RecommendedGameBadgeComponent, BrandLogoComponent],
  templateUrl: './games-catalog-page.component.html',
  styleUrls: ['./games-catalog-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesCatalogPageComponent {
  private readonly patientContext = inject(PatientContextService);
  private readonly catalog = inject(GameCatalogService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

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

  goBack(): void {
    void this.router.navigate(['/games/patient-selection'], { queryParams: { from: 'games' } });
  }

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
    const enabling = !this.duoEnabledForGameB();
    this.duoEnabledForGameB.update((enabled) => !enabled);
    if (enabling) {
      const patient = this.patientContext.getActivePatientSnapshot();
      this.http.post(
        `${environment.backendUrl}/api/duo/generate/${patient.id}`,
        { patientName: patient.firstName },
      ).subscribe({ error: () => {} });
    }
  }

  isRecommended(game: CatalogGame): boolean {
    return this.recommendedGameId() === game.id;
  }
}
