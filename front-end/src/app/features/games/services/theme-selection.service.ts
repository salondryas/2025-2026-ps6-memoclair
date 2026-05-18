import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GameTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const AVAILABLE_THEMES: GameTheme[] = [
  {
    id: 'famille',
    name: 'Famille',
    description: 'Souvenirs familiaux et proches',
    icon: '👨‍👩‍👧‍👦',
    color: '#ec4899',
  },
  {
    id: 'quotidien',
    name: 'Quotidien',
    description: 'Objets et activités du jour',
    icon: '🏠',
    color: '#f59e0b',
  },
  {
    id: 'musique',
    name: 'Musique',
    description: 'Chansons et mélodies',
    icon: '🎵',
    color: '#8b5cf6',
  },
  {
    id: 'enfance',
    name: 'Enfance',
    description: 'Souvenirs d\'enfance',
    icon: '🎈',
    color: '#06b6d4',
  },
  {
    id: 'lieux',
    name: 'Lieux',
    description: 'Endroits significatifs',
    icon: '🗺️',
    color: '#10b981',
  },
];

@Injectable({ providedIn: 'root' })
export class ThemeSelectionService {
  private selectedThemes$ = new BehaviorSubject<string[]>(['quotidien']);

  constructor() {
    this.loadThemesFromStorage();
  }

  getSelectedThemes(): Observable<string[]> {
    return this.selectedThemes$.asObservable();
  }

  setSelectedThemes(themeIds: string[]): void {
    this.selectedThemes$.next(themeIds);
    this.saveThemesToStorage(themeIds);
  }

  toggleTheme(themeId: string): void {
    const current = this.selectedThemes$.value;
    const updated = current.includes(themeId)
      ? current.filter(id => id !== themeId)
      : [...current, themeId];
    this.setSelectedThemes(updated);
  }

  getThemeById(id: string): GameTheme | undefined {
    return AVAILABLE_THEMES.find(theme => theme.id === id);
  }

  private loadThemesFromStorage(): void {
    try {
      const stored = localStorage.getItem('mc_selected_themes');
      if (stored) {
        const themes = JSON.parse(stored);
        this.selectedThemes$.next(themes);
      }
    } catch (error) {
      console.warn('Failed to load themes from storage:', error);
    }
  }

  private saveThemesToStorage(themes: string[]): void {
    try {
      localStorage.setItem('mc_selected_themes', JSON.stringify(themes));
    } catch (error) {
      console.warn('Failed to save themes to storage:', error);
    }
  }
}
