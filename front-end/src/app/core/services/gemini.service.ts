import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { MediaItem } from '../../models/media.model';
import { DuoRound } from '../../features/games/services/duo-facilitation.service';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly apiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${environment.geminiApiKey}`;

  constructor(private readonly http: HttpClient) {}

  generateRounds(mediaItems: MediaItem[], patientName: string): Observable<DuoRound[]> {
    const prompt = this.buildPrompt(mediaItems, patientName);

    console.group('[Gemini] Génération de questions duo');
    console.log('Patient :', patientName);
    console.log('Médias envoyés :', mediaItems.map(i => ({ titre: i.title, type: i.kind, description: i.description })));
    console.log('Prompt complet :', prompt);
    console.groupEnd();

    return this.http.post<GeminiResponse>(this.apiUrl, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    }).pipe(
      timeout(15000),
      map(response => {
        const rounds = this.parseRounds(response, mediaItems);
        console.log('[Gemini] Réponse reçue :', rounds);
        return rounds;
      }),
      catchError((err) => {
        console.error('[Gemini] Erreur :', err);
        return of([]);
      }),
    );
  }

  private buildPrompt(items: MediaItem[], patientName: string): string {
    const souvenirs = items.map((item, i) =>
      `Souvenir ${i + 1} :
  - Titre : ${item.title}
  - Type : ${item.kind === 'image' ? 'Photo' : item.kind === 'audio' ? 'Audio / Musique' : 'Texte'}
  - Catégorie : ${this.cueTypeLabel(item.cueType)}
  - Description : ${item.description || item.clinicalNote}`
    ).join('\n\n');

    return `Tu es un thérapeute spécialisé en réminiscence pour les patients atteints d'Alzheimer.

Génère ${items.length} questions de réminiscence pour une séance en mode duo entre le patient ${patientName} et un membre de sa famille (l'aidant).

Règles importantes :
- Les questions doivent être douces, ouvertes, non-stressantes
- Elles doivent s'appuyer directement sur le souvenir décrit
- Les choix pour l'aidant sont formulés à la 3ème personne ou avec "ton/ta"
- Les choix pour le patient sont formulés à la 1ère personne
- Le feedbackAgree est chaleureux et valorisant si les deux sont d'accord
- Tout doit être en français

Souvenirs :
${souvenirs}

Réponds UNIQUEMENT avec un tableau JSON valide de ${items.length} objets dans l'ordre des souvenirs :
[
  {
    "question": "Question douce sur le souvenir",
    "helper": "Conseil court pour l'aidant",
    "choicesAidant": ["Choix A pour l'aidant", "Choix B pour l'aidant"],
    "choicesAccueilli": ["Choix A pour le patient", "Choix B pour le patient"],
    "feedbackAgree": "Message chaleureux si accord"
  }
]`;
  }

  private parseRounds(response: GeminiResponse, items: MediaItem[]): DuoRound[] {
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Retire les balises markdown si Gemini les ajoute (```json ... ```)
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    try {
      const parsed: Array<{
        question: string;
        helper: string;
        choicesAidant: string[];
        choicesAccueilli: string[];
        feedbackAgree: string;
      }> = JSON.parse(cleaned);

      return parsed.map((round, i) => ({
        mediaType: (items[i]?.kind === 'audio' ? 'audio' : 'image') as 'image' | 'audio',
        mediaSrc: '',
        mediaAlt: items[i]?.title ?? '',
        mediaCaption: items[i]?.title ?? '',
        question: round.question,
        helper: round.helper,
        choicesAidant: round.choicesAidant,
        choicesAccueilli: round.choicesAccueilli,
        feedbackAgree: round.feedbackAgree,
      }));
    } catch {
      return [];
    }
  }

  private cueTypeLabel(cueType: string): string {
    const labels: Record<string, string> = {
      person: 'Personne / famille',
      location: 'Lieu / endroit',
      event: 'Événement',
      music: 'Musique / son',
    };
    return labels[cueType] ?? cueType;
  }
}
