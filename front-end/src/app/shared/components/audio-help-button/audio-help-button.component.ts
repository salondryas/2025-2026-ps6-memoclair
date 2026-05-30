import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { TtsService } from '../../../core/services/tts.service';

@Component({
  selector: 'app-audio-help-button',
  standalone: true,
  templateUrl: './audio-help-button.component.html',
  styleUrls: ['./audio-help-button.component.scss'],
})
export class AudioHelpButtonComponent {
  @Input() texts: string[] = [];
  @Output() itemStart = new EventEmitter<number | null>();

  readonly tts = inject(TtsService);

  toggle(): void {
    if (this.tts.isReading()) {
      this.tts.cancel();
      this.itemStart.emit(null);
    } else {
      this.tts.speakHelp(
        this.texts,
        (index: number) => this.itemStart.emit(index),
        () => this.itemStart.emit(null),
      );
    }
  }
}
