import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { MediaItem } from '../../../models/media.model';
import { PatientId } from '../../../models/patient.model';
import { GameBPrompt, GameBSessionState } from '../../../models/game-b.model';
import { MediaLibraryService } from '../../caregiver/services/media-library.service';
import { HintService } from './hint.service';
import { SkipService } from './skip.service';
import { CaregiverProfileService } from '../../caregiver/services/caregiver-profile.service';
import { PatientContextService } from '../../../core/services/patient-context.service';

const GENERIC_PROMPT_PARTIALS: Array<Omit<GameBPrompt, 'relances'>> = [
  {
    id: 'generic-vacances-route',
    source: 'generic',
    headline: 'Les grands départs',
    patientLine: 'Les longs trajets en voiture, les pauses sur l’aire d’autoroute… Est-ce que cela vous rappelle quelque chose ?',
    supportLabel: 'Route des vacances',
    supportEmoji: '🚗',
    choices: [
      { id: 'g-v-1', label: 'Une destination qu’on attendait', anchorWords: ['destination', 'vacances', 'été'] },
      { id: 'g-v-2', label: 'Les bruits et les odeurs de la route', anchorWords: ['route', 'odeur', 'radio'] },
      { id: 'g-v-3', label: 'Une pause avec la famille', anchorWords: ['pause', 'famille', 'goûter'] },
    ],
    consolidatedKeywords: ['vacances', 'route', 'voiture', 'été', 'famille', 'départ', 'voyage'],
  },
  {
    id: 'generic-marche',
    source: 'generic',
    headline: 'Le marché du village',
    patientLine: 'Les étals, les voix, les couleurs des fruits… Est-ce que cela vous parle ?',
    supportLabel: 'Marché et quartier',
    supportEmoji: '🧺',
    choices: [
      { id: 'g-m-1', label: 'Un vendeur qu’on connaissait bien', anchorWords: ['marché', 'vendeur', 'habitude'] },
      { id: 'g-m-2', label: 'Un plat qu’on aimait acheter', anchorWords: ['fromage', 'pain', 'légumes'] },
      { id: 'g-m-3', label: 'Le bruit des conversations', anchorWords: ['bruit', 'quartier', 'dimanche'] },
    ],
    consolidatedKeywords: ['marché', 'village', 'quartier', 'étal', 'dimanche', 'courses'],
  },
  {
    id: 'generic-musique-salon',
    source: 'generic',
    headline: 'La musique à la maison',
    patientLine: 'Une chanson qu’on entendait souvent, la radio ou le tourne-disque… Qu’est-ce que cela vous évoque ?',
    supportLabel: 'Musique à la maison',
    supportEmoji: '🎵',
    choices: [
      { id: 'g-mu-1', label: 'Un moment du dimanche', anchorWords: ['dimanche', 'radio', 'tranquille'] },
      { id: 'g-mu-2', label: 'Quelqu’un qui mettait la musique', anchorWords: ['famille', 'parent', 'écoute'] },
      { id: 'g-mu-3', label: 'Une danse ou un rythme connu', anchorWords: ['danse', 'rythme', 'chanson'] },
    ],
    consolidatedKeywords: ['musique', 'chanson', 'radio', 'disque', 'dimanche', 'famille'],
  },
  {
    id: 'generic-jardin-potager',
    source: 'generic',
    headline: 'Le jardin potager',
    patientLine: 'S’occuper de la terre, voir pousser les légumes… Est-ce un souvenir que vous avez ?',
    supportLabel: 'Le potager',
    supportEmoji: '🥕',
    choices: [
      { id: 'g-j-1', label: 'L’odeur de la terre mouillée', anchorWords: ['terre', 'pluie', 'odeur'] },
      { id: 'g-j-2', label: 'La récolte des premiers légumes', anchorWords: ['récolte', 'légumes', 'été'] },
      { id: 'g-j-3', label: 'Le calme du jardin', anchorWords: ['calme', 'jardin', 'paix'] },
    ],
    consolidatedKeywords: ['jardin', 'potager', 'terre', 'légumes', 'nature', 'travail'],
  },
  {
    id: 'generic-ecole-autrefois',
    source: 'generic',
    headline: 'L’école d’autrefois',
    patientLine: 'L’odeur de la craie, les encriers, la cour de récréation… Qu’est-ce que cela vous rappelle ?',
    supportLabel: 'L’école',
    supportEmoji: '📝',
    choices: [
      { id: 'g-e-1', label: 'L’écriture à la plume', anchorWords: ['plume', 'encre', 'écriture'] },
      { id: 'g-e-2', label: 'Les jeux dans la cour', anchorWords: ['jeux', 'récréation', 'amis'] },
      { id: 'g-e-3', label: 'Le maître ou la maîtresse', anchorWords: ['maître', 'leçon', 'classe'] },
    ],
    consolidatedKeywords: ['école', 'craie', 'encre', 'enfance', 'classe', 'élève'],
  },
  {
    id: 'generic-cuisine-famille',
    source: 'generic',
    headline: 'La cuisine en famille',
    patientLine: 'Les bons petits plats qui mijotent, les repas partagés… Quel souvenir en gardez-vous ?',
    supportLabel: 'Cuisine familiale',
    supportEmoji: '🍳',
    choices: [
      { id: 'g-c-1', label: 'Le plat préféré du dimanche', anchorWords: ['plat', 'dimanche', 'goût'] },
      { id: 'g-c-2', label: 'L’odeur de la cuisine', anchorWords: ['odeur', 'foyer', 'cuisine'] },
      { id: 'g-c-3', label: 'Une fête de famille', anchorWords: ['fête', 'repas', 'famille'] },
    ],
    consolidatedKeywords: ['cuisine', 'repas', 'famille', 'odeur', 'dimanche', 'fête'],
  },
  {
    id: 'generic-hiver-cheminee',
    source: 'generic',
    headline: 'Les soirs d’hiver',
    patientLine: 'Le feu dans la cheminée, le froid dehors… Est-ce une ambiance qui vous revient ?',
    supportLabel: 'Soirs d’hiver',
    supportEmoji: '🔥',
    choices: [
      { id: 'g-h-1', label: 'Le crépitement du feu', anchorWords: ['feu', 'chaleur', 'bois'] },
      { id: 'g-h-2', label: 'Une boisson chaude', anchorWords: ['soupe', 'chocolat', 'chaud'] },
      { id: 'g-h-3', label: 'Se mettre à l’abri du froid', anchorWords: ['froid', 'maison', 'confort'] },
    ],
    consolidatedKeywords: ['hiver', 'feu', 'cheminée', 'chaleur', 'froid', 'maison'],
  },
  {
    id: 'generic-balade-foret',
    source: 'generic',
    headline: 'Une balade en forêt',
    patientLine: 'Le bruit des feuilles, l’air frais des bois… Vous souvenez-vous d’une promenade ?',
    supportLabel: 'Promenade en forêt',
    supportEmoji: '🌲',
    choices: [
      { id: 'g-b-1', label: 'Le ramassage des champignons', anchorWords: ['champignons', 'cueillette', 'bois'] },
      { id: 'g-b-2', label: 'Le chant des oiseaux', anchorWords: ['oiseaux', 'chant', 'nature'] },
      { id: 'g-b-3', label: 'La fraîcheur sous les arbres', anchorWords: ['frais', 'ombre', 'arbres'] },
    ],
    consolidatedKeywords: ['forêt', 'bois', 'balade', 'nature', 'oiseaux', 'arbres'],
  },
  {
    id: 'generic-fetes-village',
    source: 'generic',
    headline: 'Les fêtes de village',
    patientLine: 'La musique, les danses, les lampions… Est-ce un souvenir joyeux pour vous ?',
    supportLabel: 'Fête de village',
    supportEmoji: '🎡',
    choices: [
      { id: 'g-f-1', label: 'Le bal populaire', anchorWords: ['bal', 'danse', 'musique'] },
      { id: 'g-f-2', label: 'Les attractions ou jeux', anchorWords: ['jeux', 'fête', 'joie'] },
      { id: 'g-f-3', label: 'Rencontrer les voisins', anchorWords: ['voisins', 'amis', 'rencontre'] },
    ],
    consolidatedKeywords: ['fête', 'village', 'bal', 'danse', 'musique', 'été'],
  },
];

@Injectable({
  providedIn: 'root',
})
export class GameBReminiscenceService {
  private readonly stateSubject = new BehaviorSubject<GameBSessionState | null>(null);

  readonly state$ = this.stateSubject.asObservable();

  constructor(
    private readonly mediaLibraryService: MediaLibraryService,
    private readonly hintService: HintService,
    private readonly skipService: SkipService,
    private readonly patientContext: PatientContextService,
    private readonly caregiverProfile: CaregiverProfileService,
  ) {}

  startSession(patientId: PatientId): GameBSessionState {
    const profile = this.caregiverProfile.getProfile(patientId);
    let prompts = this.buildPromptDeck(patientId);

    // Slice based on profile
    prompts = prompts.slice(0, profile.questionCount);

    const initial: GameBSessionState = {
      patientId,
      prompts,
      promptIndex: 0,
      relanceIndex: 0,
      patientMessage: null,
      lastChoiceId: null,
      lastFreeText: null,
      caregiverValidated: false,
      skippedCount: 0,
    };
    this.stateSubject.next(initial);
    return initial;
  }

  getSnapshot(): GameBSessionState | null {
    return this.stateSubject.getValue();
  }

  getCurrentPrompt(): GameBPrompt | null {
    const state = this.getSnapshot();
    if (!state || !state.prompts.length) {
      return null;
    }
    return state.prompts[state.promptIndex] ?? null;
  }

  /** Toute sélection de piste est accueillie : pas de signal d’échec côté patient. */
  registerChoice(choiceId: string): void {
    this.patchState((state) => ({
      ...state,
      lastChoiceId: choiceId,
      lastFreeText: null,
      patientMessage: 'Merci pour ce souvenir partagé. Chaque piste compte.',
      caregiverValidated: false,
    }));
  }

  /** Validation sémantique tolérante sur la saisie libre. */
  registerFreeText(raw: string): void {
    const prompt = this.getCurrentPrompt();
    const normalized = raw.trim();
    if (!prompt || !normalized) {
      this.patchState((state) => ({
        ...state,
        lastFreeText: '',
        patientMessage: 'Prenez le temps de trouver vos mots, il n’y a pas d’urgence.',
        caregiverValidated: false,
      }));
      return;
    }

    const confidence = this.scoreSemanticMatch(normalized, prompt.consolidatedKeywords);
    const patientMessage =
      confidence >= 0.22
        ? 'Nous avons bien entendu votre intention. Merci pour ce que vous nous offrez.'
        : 'Merci pour cette impression : elle compte tout autant, même en quelques mots.';

    this.patchState((state) => ({
      ...state,
      lastFreeText: normalized,
      lastChoiceId: null,
      patientMessage,
      caregiverValidated: false,
    }));
  }

  /** L’aidant confirme ou porte la réponse : avance sans notion d’erreur. */
  caregiverValidateAndContinue(): void {
    const state = this.getSnapshot();
    if (!state) {
      return;
    }
    this.patchState((current) => ({
      ...current,
      caregiverValidated: true,
      patientMessage: 'Merci pour ce moment partagé. Passons en douceur à la suite.',
      promptIndex: Math.min(current.promptIndex + 1, current.prompts.length - 1),
      relanceIndex: 0,
      lastChoiceId: null,
      lastFreeText: null,
    }));
  }

  showNextRelance(): void {
    this.patchState((state) => {
      const prompt = state.prompts[state.promptIndex];
      if (!prompt || !prompt.relances.length) {
        return state;
      }
      const nextIndex = (state.relanceIndex + 1) % prompt.relances.length;
      return { ...state, relanceIndex: nextIndex };
    });
  }

  skipCurrentPrompt(): void {
    const state = this.getSnapshot();
    const prompt = this.getCurrentPrompt();
    if (!state || !prompt) {
      return;
    }

    this.skipService.recordSkip({
      game: 'game-b',
      stepId: prompt.id,
      patientId: state.patientId,
    });

    const atLast = state.promptIndex >= state.prompts.length - 1;
    this.patchState((current) => ({
      ...current,
      skippedCount: current.skippedCount + 1,
      patientMessage: atLast
        ? 'Nous terminons ce parcours en douceur. Merci pour votre présence.'
        : 'Souvenir passé sans insistance. Passons au suivant, toujours à votre rythme.',
      promptIndex: atLast ? current.promptIndex : current.promptIndex + 1,
      relanceIndex: 0,
      lastChoiceId: null,
      lastFreeText: null,
      caregiverValidated: false,
    }));
  }

  reset(): void {
    this.stateSubject.next(null);
  }

  scoreSemanticMatch(input: string, keywords: string[]): number {
    const inputTokens = this.tokenize(input);
    if (!inputTokens.length) {
      return 0;
    }

    const keyTokens = keywords.flatMap((keyword) => this.tokenize(keyword));
    if (!keyTokens.length) {
      return 0;
    }

    let hits = 0;
    for (const token of inputTokens) {
      const direct = keyTokens.some((key) => key === token || key.includes(token) || token.includes(key));
      if (direct) {
        hits += 1;
        continue;
      }
      const prefix = keyTokens.some(
        (key) => key.length >= 4 && token.length >= 4 && (key.startsWith(token.slice(0, 4)) || token.startsWith(key.slice(0, 4))),
      );
      if (prefix) {
        hits += 0.65;
      }
    }

    return hits / inputTokens.length;
  }

  private buildPromptDeck(patientId: PatientId): GameBPrompt[] {
    const mediaItems = this.mediaLibraryService.getMediaItems(patientId);
    const personal = mediaItems
      .filter((item) => item.kind === 'image')
      .map((item) => this.mediaItemToPrompt(item));

    if (personal.length) {
      return [...personal, ...this.buildGenericPromptsWithSuffix('-mix')];
    }

    return this.buildGenericPromptsWithSuffix('');
  }

  private buildGenericPromptsWithSuffix(suffix: string): GameBPrompt[] {
    return GENERIC_PROMPT_PARTIALS.map((partial) => {
      const id = suffix ? `${partial.id}${suffix}` : partial.id;
      return {
        ...partial,
        id,
        relances: this.hintService.buildFromGenericPrompt(id),
      };
    });
  }

  private mediaItemToPrompt(item: MediaItem): GameBPrompt {
    const baseKeywords = [
      ...this.tokenize(item.title),
      ...this.tokenize(item.clinicalNote),
      ...this.tokenize(item.fileName.replace(/\.[a-z0-9]+$/i, '')),
    ];

    return {
      id: `personal-${item.id}`,
      source: 'personal',
      mediaItemId: item.id,
      headline: item.title,
      patientLine: `Cette image parle de « ${item.title} ». Est-ce que cela vous évoque un moment ou une sensation ?`,
      supportLabel: item.title,
      supportEmoji: item.cueType === 'music' ? '🎵' : '🖼️',
      choices: [
        { id: `${item.id}-lieu`, label: 'Un lieu ou un cadre qui revient', anchorWords: ['lieu', 'maison', 'jardin', 'dehors'] },
        { id: `${item.id}-proche`, label: 'Une personne ou une présence proche', anchorWords: ['famille', 'ami', 'proche'] },
        { id: `${item.id}-sensation`, label: 'Une sensation agréable (odeur, lumière, calme…)', anchorWords: ['odeur', 'lumière', 'calme', 'chaleur'] },
      ],
      relances: this.hintService.buildFromMedia(item),
      consolidatedKeywords: Array.from(new Set([...baseKeywords, 'souvenir', 'photo', 'image'])),
    };
  }

  private patchState(mutator: (state: GameBSessionState) => GameBSessionState): void {
    const current = this.getSnapshot();
    if (!current) {
      return;
    }
    this.stateSubject.next(mutator(current));
  }

  private tokenize(value: string): string[] {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9àâäéèêëïîôùûç]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length > 1);
  }
}
