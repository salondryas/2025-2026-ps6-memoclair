import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Minus,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-angular';

import { SoundEffectsService } from '../../../../core/services/sound-effects.service';

@Component({
  selector: 'app-bg-music-control',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Volume2, VolumeX, Plus, Minus }),
    },
  ],
  templateUrl: './bg-music-control.component.html',
  styleUrls: ['./bg-music-control.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgMusicControlComponent implements OnDestroy {
  isOpen = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(public soundService: SoundEffectsService) {}

  get activeDotsCount(): number {
    if (!this.soundService.isBgMusicPlaying || this.soundService.bgVolume <= 0) {
      return 0;
    }

    if (this.soundService.bgVolume <= 0.33) {
      return 1;
    }

    if (this.soundService.bgVolume <= 0.66) {
      return 2;
    }

    return 3;
  }

  ngOnDestroy(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
  }

  onMouseEnter(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.isOpen = true;
  }

  onMouseLeave(): void {
    this.closeTimer = setTimeout(() => {
      this.isOpen = false;
    }, 2500);
  }

  increaseVolume(): void {
    this.soundService.setBgVolumeValue(this.soundService.bgVolume + 0.05);
    if (!this.soundService.isBgMusicPlaying) {
      this.soundService.toggleBgMusic();
    }
  }

  decreaseVolume(): void {
    this.soundService.setBgVolumeValue(this.soundService.bgVolume - 0.05);
    if (this.soundService.bgVolume <= 0 && this.soundService.isBgMusicPlaying) {
      this.soundService.toggleBgMusic();
    }
  }

  toggleMute(): void {
    this.soundService.toggleBgMusic();
  }
}
