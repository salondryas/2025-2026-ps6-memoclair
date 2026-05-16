import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import {
  AccessibilityPreferencesService,
  AccessibilityPreferences,
} from '../../../core/services/accessibility-preferences.service';
import { FontSizeSlider } from '../../../shared/components/settings/font-size-slider/font-size-slider';
import { ThemeToggle } from '../../../shared/components/settings/theme-toggle/theme-toggle';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FontSizeSlider, ThemeToggle],
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  prefs!: AccessibilityPreferences;

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly accessibilityService: AccessibilityPreferencesService) {}

  ngOnInit(): void {
    this.accessibilityService.prefs$
      .pipe(takeUntil(this.destroy$))
      .subscribe((prefs) => (this.prefs = prefs));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTextSizeChange(size: number): void {
    this.accessibilityService.setTextSize(size);
  }

  onHighContrastChange(enabled: boolean): void {
    this.accessibilityService.setHighContrast(enabled);
  }

  onAudioReadingChange(enabled: boolean): void {
    this.accessibilityService.setAudioReading(enabled);
  }

  reset(): void {
    this.accessibilityService.reset();
  }
}
