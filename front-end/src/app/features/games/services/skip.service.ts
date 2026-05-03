import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { PatientId } from '../../../models/patient.model';

export type SkipGameId = 'game-a' | 'game-b' | 'game-duo';

export interface SkipEvent {
  game: SkipGameId;
  stepId: string;
  patientId: PatientId;
  at: string;
}

@Injectable({
  providedIn: 'root',
})
export class SkipService {
  private readonly skipSubject = new Subject<SkipEvent>();

  readonly skip$: Observable<SkipEvent> = this.skipSubject.asObservable();

  recordSkip(payload: Omit<SkipEvent, 'at'>): void {
    this.skipSubject.next({
      ...payload,
      at: new Date().toISOString(),
    });
  }
}
