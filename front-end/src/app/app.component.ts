import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccessibilityPreferencesService } from './core/services/accessibility-preferences.service';
import { SoundEffectsService } from './core/services/sound-effects.service';
import { BgMusicControlComponent } from './shared/components/layout/bg-music-control/bg-music-control.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, BgMusicControlComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  private prefsSub: Subscription | null = null;

  constructor(
    public soundEffects: SoundEffectsService,
    private readonly accessibilityPrefs: AccessibilityPreferencesService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.prefsSub = this.accessibilityPrefs.prefs$.subscribe((prefs) => {
      this.document.body.classList.toggle('high-contrast', prefs.highContrastEnabled);
    });

    const applyOnFirstInteraction = () => {
      this.soundEffects.applyDefaultBgMusic();
      this.document.removeEventListener('click', applyOnFirstInteraction, { capture: true });
    };
    this.document.addEventListener('click', applyOnFirstInteraction, { capture: true, once: true });
  }

  ngOnDestroy(): void {
    this.prefsSub?.unsubscribe();
  }
}
