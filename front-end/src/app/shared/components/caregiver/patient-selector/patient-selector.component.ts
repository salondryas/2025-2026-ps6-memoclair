import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PatientContextService } from '../../../../core/services/patient-context.service';
import { PatientSummary, PatientId } from '../../../../models/patient.model';

@Component({
  selector: 'mc-patient-selector',
  templateUrl: './patient-selector.component.html',
  styleUrls: ['./patient-selector.component.scss'],
})
export class PatientSelectorComponent implements OnInit, OnDestroy {
  patients$!: Observable<PatientSummary[]>;
  selectedPatientId!: string;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly patientContextService: PatientContextService) {}

  ngOnInit(): void {
    this.patients$ = new Observable((observer) => {
      observer.next(this.patientContextService.getPatients());
      observer.complete();
    });

    this.patientContextService.activePatient$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patient) => {
        this.selectedPatientId = patient.id;
      });
  }

  onPatientChange(patientId: PatientId): void {
    this.patientContextService.setActivePatient(patientId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
