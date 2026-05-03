import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-games-entry-placeholder',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="games-placeholder">
      <section class="games-placeholder__card">
        <p class="games-placeholder__kicker">Espace jeux</p>
        <h1>Le catalogue Angular arrive juste après</h1>
        <p>
          La migration du dashboard familial a bien branché l’accès Jeux.
          Le catalogue patient et les parcours de séance seront raccordés dans les prochaines issues.
        </p>

        <div class="games-placeholder__actions">
          <a routerLink="/games/game-b">Ouvrir le jeu B — réminiscence</a>
          <a routerLink="/caregiver/family-dashboard">Retour au dashboard familial</a>
          <a routerLink="/caregiver/media">Ouvrir la médiathèque</a>
        </div>
      </section>
    </main>
  `,
  styles: [`
    .games-placeholder {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 1.5rem;
    }

    .games-placeholder__card {
      max-width: 760px;
      padding: 2rem;
      border-radius: 28px;
      border: 1px solid rgba(95, 138, 111, 0.14);
      background: #fff;
      box-shadow: 0 18px 40px rgba(47, 66, 56, 0.08);
      color: #22302a;
    }

    .games-placeholder__kicker {
      margin: 0 0 0.75rem;
      color: #466654;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0 0 1rem;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1.05;
    }

    p {
      margin: 0;
      color: #66736e;
      line-height: 1.65;
    }

    .games-placeholder__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      margin-top: 1.25rem;
    }

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0.8rem 1.1rem;
      border-radius: 16px;
      border: 1px solid rgba(95, 138, 111, 0.18);
      background: #f8fbf8;
      color: #22302a;
      font-weight: 800;
      text-decoration: none;
    }
  `],
})
export class GamesEntryPlaceholderComponent {}
