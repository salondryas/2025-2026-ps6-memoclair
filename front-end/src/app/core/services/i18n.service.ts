import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

export interface LanguageConfig {
  code: Language;
  name: string;
  flag: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  fr: {
    'game.hint': 'Indice',
    'game.skip': 'Passer',
    'game.pause': 'Pause',
    'game.resume': 'Reprendre',
    'game.next': 'Suivant',
    'game.read': 'Aide sonore',
    'game.excellent': 'Excellent !',
    'game.good': 'Très bien !',
    'game.correct': 'Correct !',
    'game.incorrect': 'Pas grave, on continue.',
    'game.finished': 'Séance terminée',
  },
  en: {
    'game.hint': 'Hint',
    'game.skip': 'Skip',
    'game.pause': 'Pause',
    'game.resume': 'Resume',
    'game.next': 'Next',
    'game.read': 'Audio Help',
    'game.excellent': 'Excellent!',
    'game.good': 'Very good!',
    'game.correct': 'Correct!',
    'game.incorrect': 'No worries, let\'s continue.',
    'game.finished': 'Session completed',
  },
  es: {
    'game.hint': 'Pista',
    'game.skip': 'Saltar',
    'game.pause': 'Pausa',
    'game.resume': 'Reanudar',
    'game.next': 'Siguiente',
    'game.read': 'Ayuda de audio',
    'game.excellent': '¡Excelente!',
    'game.good': '¡Muy bien!',
    'game.correct': '¡Correcto!',
    'game.incorrect': 'No importa, continuemos.',
    'game.finished': 'Sesión completada',
  },
  de: {
    'game.hint': 'Hinweis',
    'game.skip': 'Überspringen',
    'game.pause': 'Pause',
    'game.resume': 'Fortsetzen',
    'game.next': 'Weiter',
    'game.read': 'Audiohilfe',
    'game.excellent': 'Ausgezeichnet!',
    'game.good': 'Sehr gut!',
    'game.correct': 'Richtig!',
    'game.incorrect': 'Kein Problem, machen wir weiter.',
    'game.finished': 'Sitzung abgeschlossen',
  },
  it: {
    'game.hint': 'Suggerimento',
    'game.skip': 'Salta',
    'game.pause': 'Pausa',
    'game.resume': 'Riprendi',
    'game.next': 'Successivo',
    'game.read': 'Aiuto audio',
    'game.excellent': 'Eccellente!',
    'game.good': 'Molto bene!',
    'game.correct': 'Corretto!',
    'game.incorrect': 'Non importa, continuiamo.',
    'game.finished': 'Sessione completata',
  },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private currentLanguage$ = new BehaviorSubject<Language>('fr');

  constructor() {
    this.loadLanguageFromStorage();
  }

  getCurrentLanguage(): Observable<Language> {
    return this.currentLanguage$.asObservable();
  }

  setLanguage(language: Language): void {
    this.currentLanguage$.next(language);
    this.saveLanguageToStorage(language);
  }

  translate(key: string, language?: Language): string {
    const lang = language || this.currentLanguage$.value;
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['fr'][key] || key;
  }

  getLanguageConfig(language: Language): LanguageConfig | undefined {
    return SUPPORTED_LANGUAGES.find(l => l.code === language);
  }

  private loadLanguageFromStorage(): void {
    try {
      const stored = localStorage.getItem('mc_language');
      if (stored && this.isValidLanguage(stored)) {
        this.currentLanguage$.next(stored as Language);
      }
    } catch (error) {
      console.warn('Failed to load language from storage:', error);
    }
  }

  private saveLanguageToStorage(language: Language): void {
    try {
      localStorage.setItem('mc_language', language);
    } catch (error) {
      console.warn('Failed to save language to storage:', error);
    }
  }

  private isValidLanguage(lang: string): boolean {
    return SUPPORTED_LANGUAGES.some(l => l.code === lang);
  }
}
