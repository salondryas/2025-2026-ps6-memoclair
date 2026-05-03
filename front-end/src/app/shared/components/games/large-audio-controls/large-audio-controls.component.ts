import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-large-audio-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './large-audio-controls.component.html',
  styleUrls: ['./large-audio-controls.component.scss'],
})
export class LargeAudioControlsComponent implements OnDestroy {
  @Input() src = '';

  @ViewChild('player', { static: true }) playerRef!: ElementRef<HTMLAudioElement>;

  isPlaying = false;
  currentTime = 0;
  duration = 0;

  readonly bars = Array.from({ length: 20 });

  ngOnDestroy(): void {
    const audio = this.playerRef?.nativeElement;
    if (audio) { audio.pause(); audio.src = ''; }
  }

  onLoadedMetadata(): void {
    this.duration = this.playerRef.nativeElement.duration || 0;
  }

  onTimeUpdate(): void {
    this.currentTime = this.playerRef.nativeElement.currentTime || 0;
  }

  onEnded(): void {
    this.isPlaying = false;
  }

  togglePlayPause(): void {
    const audio = this.playerRef.nativeElement;
    if (this.isPlaying) {
      audio.pause();
      this.isPlaying = false;
    } else {
      void audio.play();
      this.isPlaying = true;
    }
  }

  seek(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.playerRef.nativeElement.currentTime = val;
    this.currentTime = val;
  }

  rewind5(): void {
    const audio = this.playerRef.nativeElement;
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }

  forward5(): void {
    const audio = this.playerRef.nativeElement;
    audio.currentTime = Math.min(this.duration || 0, audio.currentTime + 5);
  }

  formatTime(seconds: number): string {
    if (!Number.isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get progress(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
  }
}
