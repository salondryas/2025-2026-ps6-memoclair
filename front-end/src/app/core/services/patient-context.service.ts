import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { PatientId, PatientProfile, PatientSummary } from '../../models/patient.model';
import { PatientRepositoryMock } from '../../mocks/patient-repository.mock';
import { StorageService } from './storage.service';

const ACTIVE_PATIENT_STORAGE_KEY = 'mc_active_patient_id';

@Injectable({
  providedIn: 'root',
})
export class PatientContextService {
  private patients: PatientSummary[];
  private readonly activePatientSubject: BehaviorSubject<PatientSummary>;

  readonly activePatient$: Observable<PatientSummary>;

  constructor(
    private readonly storageService: StorageService,
    private readonly patientRepository: PatientRepositoryMock,
  ) {
    this.patients = this.patientRepository.getPatients();
    this.activePatientSubject = new BehaviorSubject<PatientSummary>(this.resolveInitialPatient());
    this.activePatient$ = this.activePatientSubject.asObservable();
  }

  getPatients(): PatientSummary[] {
    return this.patients.map((patient) => ({ ...patient }));
  }

  getActivePatientSnapshot(): PatientSummary {
    return this.activePatientSubject.getValue();
  }

  setActivePatient(patientId: PatientId): void {
    const patient = this.patientRepository.getPatientById(patientId);
    this.storageService.setLocalItem(ACTIVE_PATIENT_STORAGE_KEY, patient.id);
    this.storageService.setSessionItem(ACTIVE_PATIENT_STORAGE_KEY, patient.id);
    this.activePatientSubject.next(patient);
  }

  addPatient(summary: PatientSummary, profile: PatientProfile): void {
    this.patientRepository.addPatient(summary, profile);
    this.patients = this.patientRepository.getPatients();
    this.setActivePatient(summary.id);
  }

  private resolveInitialPatient(): PatientSummary {
    const localPatientId = this.storageService.getLocalItem<PatientId>(ACTIVE_PATIENT_STORAGE_KEY);
    const sessionPatientId = this.storageService.getSessionItem<PatientId>(ACTIVE_PATIENT_STORAGE_KEY);
    const patientId = localPatientId ?? sessionPatientId ?? this.patients[0].id;

    return this.patientRepository.getPatientById(patientId);
  }
}
