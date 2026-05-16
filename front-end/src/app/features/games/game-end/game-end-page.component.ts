import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { PatientContextService } from '../../../core/services/patient-context.service';
import { SoundEffectsService } from '../../../core/services/sound-effects.service';
import { PatientSummary } from '../../../models/patient.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-game-end-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-end-page.component.html',
  styleUrls: ['./game-end-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameEndPageComponent implements OnInit {
  readonly patientName$: Observable<PatientSummary> = this.patientContext.activePatient$;

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly router: Router,
    private readonly soundEffects: SoundEffectsService,
  ) {}

  ngOnInit(): void {
    this.soundEffects.play('sessionEnd');
  }

  goHome(): void {
    void this.router.navigate(['/games']);
  }
}
