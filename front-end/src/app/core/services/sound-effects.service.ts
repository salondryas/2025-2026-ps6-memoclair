import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { StorageService } from './storage.service';

const BG_MUSIC_DEFAULT_KEY = 'mc_bg_music_default';

@Injectable({ providedIn: 'root' })
export class SoundEffectsService {
  private enabled = true;
  private volume = 0.35;
  private bgMusic = new Audio('assets/sfx/global-bg-soft.mp3');
  isBgMusicPlaying = false;
  bgVolume = 0.01;
  private wasPlayingBeforeSuspend = false;
  private bgMusicDefault = false;
  private readonly bgMusicDefaultSubject = new BehaviorSubject<boolean>(false);
  readonly bgMusicDefault$ = this.bgMusicDefaultSubject.asObservable();

  private sounds = {
    success: new Audio('assets/sfx/success-soft.mp3'),
    gentleError: new Audio('assets/sfx/gentle-error.mp3'),
    hint: new Audio('assets/sfx/hint-soft.mp3'),
    transition: new Audio('assets/sfx/page-turn-soft.mp3'),
    select: new Audio('assets/sfx/select-soft.mp3'),
    sessionEnd: new Audio('assets/sfx/session-end-soft.mp3')
  };

  constructor(private readonly storage: StorageService) {
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.bgVolume;
    this.bgMusicDefault = this.storage.getLocalItem<boolean>(BG_MUSIC_DEFAULT_KEY) ?? false;
    this.bgMusicDefaultSubject.next(this.bgMusicDefault);
  }

  get defaultBgMusicEnabled(): boolean {
    return this.bgMusicDefault;
  }

  setDefaultBgMusic(enabled: boolean): void {
    this.bgMusicDefault = enabled;
    this.bgMusicDefaultSubject.next(enabled);
    this.storage.setLocalItem(BG_MUSIC_DEFAULT_KEY, enabled);
    if (enabled && !this.isBgMusicPlaying) {
      this.bgMusic.play()
        .then(() => { this.isBgMusicPlaying = true; })
        .catch(() => { this.isBgMusicPlaying = false; });
    } else if (!enabled && this.isBgMusicPlaying) {
      this.bgMusic.pause();
      this.isBgMusicPlaying = false;
    }
  }

  applyDefaultBgMusic(): void {
    if (this.bgMusicDefault && !this.isBgMusicPlaying) {
      this.bgMusic.play()
        .then(() => { this.isBgMusicPlaying = true; })
        .catch(() => { this.isBgMusicPlaying = false; });
    }
  }

  play(name: keyof typeof this.sounds): void {
    if (!this.enabled) return;
    const sound = this.sounds[name];
    sound.pause();
    sound.currentTime = 0;
    sound.volume = this.volume;
    sound.play().catch(err => console.warn('Audio play prevented:', err));
  }

  setEnabled(enabled: boolean): void { this.enabled = enabled; }
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleBgMusic(): void {
    if (this.isBgMusicPlaying) {
      this.bgMusic.pause();
      this.isBgMusicPlaying = false;
    } else {
      this.bgMusic.play()
        .then(() => { this.isBgMusicPlaying = true; })
        .catch(err => {
          console.warn('BGM play prevented:', err);
          this.isBgMusicPlaying = false;
        });
    }
  }

  setBgVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setBgVolumeValue(parseFloat(input.value));
  }

  setBgVolumeValue(volume: number): void {
    this.bgVolume = Math.max(0, Math.min(1, volume));
    this.bgMusic.volume = this.bgVolume;
  }

  suspendBgMusic(): void {
    this.wasPlayingBeforeSuspend = this.isBgMusicPlaying;
    if (this.isBgMusicPlaying) {
      this.bgMusic.pause();
    }
  }

  resumeBgMusic(): void {
    if (this.wasPlayingBeforeSuspend && !this.isBgMusicPlaying) {
      this.bgMusic.play()
        .then(() => { this.isBgMusicPlaying = true; })
        .catch(err => {
          console.warn('BGM resume prevented:', err);
          this.isBgMusicPlaying = false;
        });
    }
  }
}
