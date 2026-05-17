import { Injectable } from '@angular/core';

import { StorageService } from '../../../core/services/storage.service';

const ACTIVE_PROFESSIONAL_KEY = 'mc_active_professional_id';
const ACTIVE_FAMILY_KEY = 'mc_active_family_id';

@Injectable({
  providedIn: 'root',
})
export class ProfileSelectionService {
  constructor(private readonly storage: StorageService) {}

  getActiveProfessionalId(): string | null {
    return this.storage.getSessionItem<string>(ACTIVE_PROFESSIONAL_KEY)
      ?? this.storage.getLocalItem<string>(ACTIVE_PROFESSIONAL_KEY);
  }

  setActiveProfessionalId(id: string): void {
    this.storage.setSessionItem(ACTIVE_PROFESSIONAL_KEY, id);
    this.storage.setLocalItem(ACTIVE_PROFESSIONAL_KEY, id);
  }

  clearActiveProfessionalId(): void {
    this.storage.removeSessionItem(ACTIVE_PROFESSIONAL_KEY);
    this.storage.removeLocalItem(ACTIVE_PROFESSIONAL_KEY);
  }

  getActiveFamilyId(): string | null {
    return this.storage.getSessionItem<string>(ACTIVE_FAMILY_KEY)
      ?? this.storage.getLocalItem<string>(ACTIVE_FAMILY_KEY);
  }

  setActiveFamilyId(id: string): void {
    this.storage.setSessionItem(ACTIVE_FAMILY_KEY, id);
    this.storage.setLocalItem(ACTIVE_FAMILY_KEY, id);
  }

  clearActiveFamilyId(): void {
    this.storage.removeSessionItem(ACTIVE_FAMILY_KEY);
    this.storage.removeLocalItem(ACTIVE_FAMILY_KEY);
  }
}
