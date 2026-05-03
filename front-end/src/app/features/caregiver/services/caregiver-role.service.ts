import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { StorageService } from '../../../core/services/storage.service';
import { CaregiverRole } from '../../../models/caregiver-role.model';

const CAREGIVER_ROLE_STORAGE_KEY = 'mc_caregiver_role';

@Injectable({
  providedIn: 'root',
})
export class CaregiverRoleService {
  private readonly roleSubject: BehaviorSubject<CaregiverRole | null>;

  readonly activeRole$: Observable<CaregiverRole | null>;

  constructor(private readonly storageService: StorageService) {
    this.roleSubject = new BehaviorSubject<CaregiverRole | null>(this.readStoredRole());
    this.activeRole$ = this.roleSubject.asObservable();
  }

  getRoleSnapshot(): CaregiverRole | null {
    return this.roleSubject.getValue();
  }

  setRole(role: CaregiverRole): void {
    this.storageService.setLocalItem(CAREGIVER_ROLE_STORAGE_KEY, role);
    this.storageService.setSessionItem(CAREGIVER_ROLE_STORAGE_KEY, role);
    this.roleSubject.next(role);
  }

  clearRole(): void {
    this.storageService.removeLocalItem(CAREGIVER_ROLE_STORAGE_KEY);
    this.storageService.removeSessionItem(CAREGIVER_ROLE_STORAGE_KEY);
    this.roleSubject.next(null);
  }

  getHomePathForRole(role: CaregiverRole): string {
    return role === 'family' ? '/games/patient-selection?from=caregiver-family' : '/games/patient-selection?from=caregiver-professional';
  }

  private readStoredRole(): CaregiverRole | null {
    const localRole = this.storageService.getLocalItem<string>(CAREGIVER_ROLE_STORAGE_KEY);
    const sessionRole = this.storageService.getSessionItem<string>(CAREGIVER_ROLE_STORAGE_KEY);
    const raw = localRole ?? sessionRole;

    if (raw === 'family' || raw === 'professional') {
      return raw;
    }

    return null;
  }
}
