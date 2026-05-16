import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { PatientProfile } from '../../models/patient.model';

export interface AccessibilityPreferences {
  textSize: number;
  highContrastEnabled: boolean;
  audioReadingEnabled: boolean;
}

const DEFAULT_PREFS: AccessibilityPreferences = {
  textSize: 1,
  highContrastEnabled: false,
  audioReadingEnabled: true,
};

@Injectable({ providedIn: 'root' })
export class AccessibilityPreferencesService {
  private readonly prefsSubject = new BehaviorSubject<AccessibilityPreferences>({ ...DEFAULT_PREFS });

  readonly prefs$: Observable<AccessibilityPreferences> = this.prefsSubject.asObservable();

  getSnapshot(): AccessibilityPreferences {
    return { ...this.prefsSubject.getValue() };
  }

  applyFromProfile(profile: PatientProfile): void {
    this.prefsSubject.next({
      textSize: profile.textSize,
      highContrastEnabled: profile.highContrastEnabled,
      audioReadingEnabled: profile.audioReadingEnabled,
    });
  }

  setTextSize(size: number): void {
    this.prefsSubject.next({ ...this.prefsSubject.getValue(), textSize: size });
  }

  setHighContrast(enabled: boolean): void {
    this.prefsSubject.next({ ...this.prefsSubject.getValue(), highContrastEnabled: enabled });
  }

  setAudioReading(enabled: boolean): void {
    this.prefsSubject.next({ ...this.prefsSubject.getValue(), audioReadingEnabled: enabled });
  }

  reset(): void {
    this.prefsSubject.next({ ...DEFAULT_PREFS });
  }
}
