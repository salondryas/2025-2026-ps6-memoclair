import { Routes } from '@angular/router';
import { GamesShellComponent } from './games-shell.component';

export const GAMES_ROUTES: Routes = [
  {
    path: '',
    component: GamesShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./catalog/games-catalog-page.component').then((m) => m.GamesCatalogPageComponent),
      },
      {
        path: 'game-a',
        loadComponent: () =>
          import('./game-a/game-a-page.component').then((m) => m.GameAPageComponent),
      },
      {
        path: 'game-b',
        loadComponent: () =>
          import('./game-b/game-b-page.component').then((m) => m.GameBPageComponent),
      },

      {
        path: 'patient-selection',
        loadComponent: () =>
          import('./patient-selection/patient-selection-page.component').then((m) => m.PatientSelectionPageComponent),
      },
      {
        path: 'end',
        loadComponent: () =>
          import('./game-end/game-end-page.component').then((m) => m.GameEndPageComponent),
      },
    ],
  },
];
