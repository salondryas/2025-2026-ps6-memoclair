import { Injectable, NgZone, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private sessionId = 0;
  private readonly _isReading = signal(false);
  readonly isReading = this._isReading.asReadonly();

  constructor(private readonly ngZone: NgZone) {}

  private getBestFrenchVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.filter(v => v.lang.startsWith('fr'));
    return (
      fr.find(v => v.name.includes('Google')) ||
      fr.find(v => /natural|neural|enhanced/i.test(v.name)) ||
      fr.find(v => v.lang === 'fr-FR') ||
      fr[0] ||
      null
    );
  }

  private makeUtterance(text: string): SpeechSynthesisUtterance {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'fr-FR';
    utt.rate = 0.82;
    utt.pitch = 1.05;
    const voice = this.getBestFrenchVoice();
    if (voice) utt.voice = voice;
    return utt;
  }

  /** Annule toute lecture en cours et remet isReading à false. */
  cancel(): void {
    this.sessionId++;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    }
    this.ngZone.run(() => this._isReading.set(false));
  }

  /**
   * Lit un texte simple (indice, feedback…).
   * N'active PAS isReading — réservé à speak() interne.
   */
  speak(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) return;
    this.cancel();
    const id = ++this.sessionId;

    const doSpeak = () => {
      if (id !== this.sessionId) return;
      const utt = this.makeUtterance(text);
      if (onEnd) {
        utt.onend = () => {
          this.ngZone.run(() => { if (id === this.sessionId) onEnd(); });
        };
      }
      window.speechSynthesis.speak(utt);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }

  /**
   * Lit une séquence de textes pour le bouton "Aide sonore".
   * Active isReading pendant toute la lecture.
   * @param texts  Tableau de textes à lire en séquence.
   * @param onItemStart  Appelé avec l'index du texte en cours de lecture.
   * @param onDone  Appelé quand toute la séquence est terminée.
   */
  speakHelp(
    texts: string[],
    onItemStart?: (index: number) => void,
    onDone?: () => void
  ): void {
    if (!('speechSynthesis' in window) || !texts.length) return;
    this.cancel();
    const id = ++this.sessionId;
    this._isReading.set(true);

    const doSpeak = () => {
      if (id !== this.sessionId) return;
      const utts = texts.map(t => this.makeUtterance(t));

      const speakNext = (index: number) => {
        this.ngZone.run(() => {
          if (id !== this.sessionId) {
            this._isReading.set(false);
            return;
          }
          if (index >= utts.length) {
            this._isReading.set(false);
            onDone?.();
            return;
          }
          onItemStart?.(index);
          utts[index].onend = () => speakNext(index + 1);
          window.speechSynthesis.speak(utts[index]);
        });
      };

      speakNext(0);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }
}
