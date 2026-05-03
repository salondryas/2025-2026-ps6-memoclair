import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home-page/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: 'games',
    loadComponent: () =>
      import('./features/games/games-shell.component').then((m) => m.GamesShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/games/catalog/games-catalog-page.component')
            .then((m) => m.GamesCatalogPageComponent),
      },
      {
        path: 'patient-selection',
        loadComponent: () =>
          import('./features/games/patient-selection/patient-selection-page.component')
            .then((m) => m.PatientSelectionPageComponent),
      },
      {
        path: 'game-a',
        loadComponent: () =>
          import('./features/games/game-a/game-a-page.component').then((m) => m.GameAPageComponent),
      },
      {
        path: 'game-b',
        loadComponent: () =>
          import('./features/games/game-b/game-b-page.component').then((m) => m.GameBPageComponent),
      },
      {
        path: 'game-duo',
        loadComponent: () =>
          import('./features/games/game-duo/game-duo-page.component').then((m) => m.GameDuoPageComponent),
      },
      {
        path: 'end',
        loadComponent: () =>
          import('./features/games/game-end/game-end-page.component').then((m) => m.GameEndPageComponent),
      },
    ],
  },
  {
    path: 'caregiver',
    loadChildren: () =>
      import('./features/caregiver/caregiver.routes').then((m) => m.CAREGIVER_ROUTES),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
