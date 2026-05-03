import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SessionResult } from '../../../models/session.model';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { StatisticsService } from '../../caregiver/services/statistics.service';

@Component({
  selector: 'app-game-end-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './game-end-page.component.html',
  styleUrls: ['./game-end-page.component.scss'],
})
export class GameEndPageComponent implements OnInit {
  latestSession: SessionResult | null = null;

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly statisticsService: StatisticsService,
  ) {}

  ngOnInit(): void {
    const patientId = this.patientContext.getActivePatientSnapshot().id;
    this.latestSession = this.statisticsService.getSessionsForPatient(patientId)[0] ?? null;
  }

  get gameLabel(): string {
    switch (this.latestSession?.gameType) {
      case 'game-a':
        return 'Associations du quotidien';
      case 'game-b':
        return 'Mémoire & Réminiscence';
      case 'game-duo':
        return 'Mode Duo';
      default:
        return 'Jeu';
    }
  }
}
