import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SoundEffectsService {
  private enabled = true;
  private volume = 0.35;
  private bgMusic = new Audio('assets/sfx/global-bg-soft.mp3');
  isBgMusicPlaying = false;
  bgVolume = 0.01;
  private wasPlayingBeforeSuspend = false;

  private sounds = {
    success: new Audio('assets/sfx/success-soft.mp3'),
    gentleError: new Audio('assets/sfx/gentle-error.mp3'),
    hint: new Audio('assets/sfx/hint-soft.mp3'),
    transition: new Audio('assets/sfx/page-turn-soft.mp3'),
    select: new Audio('assets/sfx/select-soft.mp3'),
    sessionEnd: new Audio('assets/sfx/session-end-soft.mp3')
  };

  constructor() {
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.bgVolume;
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
      this.bgMusic.play().catch(err => console.warn('BGM play prevented:', err));
      this.isBgMusicPlaying = true;
    }
  }

  setBgVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bgVolume = parseFloat(input.value);
    this.bgMusic.volume = this.bgVolume;
  }

  suspendBgMusic(): void {
    this.wasPlayingBeforeSuspend = this.isBgMusicPlaying;
    if (this.isBgMusicPlaying) {
      this.bgMusic.pause();
    }
  }

  resumeBgMusic(): void {
    if (this.wasPlayingBeforeSuspend && this.isBgMusicPlaying) {
      this.bgMusic.play().catch(err => console.warn('BGM resume prevented:', err));
    }
  }
}
