import { Injectable } from '@angular/core';
import { CaregiverProfileService } from '../../caregiver/services/caregiver-profile.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientProfile } from '../../../models/patient.model';

export type GameAQuestionType = 'multiple-choice' | 'chrono-order';

export interface GameAChoice {
  id: 'a' | 'b' | 'c' | 'd';
  label: string;
  image: string;
}

export interface GameAStep {
  id: string;
  image: string;
  isHinted?: boolean;
}

export interface GameAQuestion {
  id: string;
  type: GameAQuestionType;
  prompt: string;
  promptImage?: string;
  choices?: GameAChoice[];
  correctChoiceId?: 'a' | 'b' | 'c' | 'd';
  steps?: GameAStep[];
  correctOrder?: string[];
  hint: string;
  goodFeedback: string;
  gentleFeedback: string;
}

export interface GameAState {
  index: number;
  questions: GameAQuestion[];
  feedback: string | null;
  hint: string | null;
  locked: boolean;
  finished: boolean;
  selectedChoiceId: 'a' | 'b' | 'c' | 'd' | null;
  profile: PatientProfile;
}

@Injectable({ providedIn: 'root' })
export class GameASessionService {
  private hintTimer: number | null = null;

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly caregiverProfile: CaregiverProfileService
  ) {}

  createInitialState(): GameAState {
    const patientId = this.patientContext.getActivePatientSnapshot().id;
    const profile = this.caregiverProfile.getProfile(patientId);
    
    return {
      index: 0,
      questions: this.buildQuestionSequence(profile),
      feedback: null,
      hint: null,
      locked: false,
      finished: false,
      selectedChoiceId: null,
      profile: profile
    };
  }

  getQuestion(state: GameAState): GameAQuestion {
    return state.questions[state.index];
  }

  startHintTimer(onHint: () => void, delaySeconds: number = 12): void {
    this.stopHintTimer();
    this.hintTimer = window.setTimeout(onHint, delaySeconds * 1000);
  }

  stopHintTimer(): void {
    if (this.hintTimer) window.clearTimeout(this.hintTimer);
    this.hintTimer = null;
  }

  choose(state: GameAState, choiceId: 'a' | 'b' | 'c' | 'd'): GameAState {
    if (state.locked || state.finished) return state;
    this.stopHintTimer();
    const q = this.getQuestion(state);
    if (q.type !== 'multiple-choice' || !q.correctChoiceId) return state;
    const isCorrect = q.correctChoiceId === choiceId;
    return {
      ...state,
      selectedChoiceId: choiceId,
      feedback: isCorrect ? q.goodFeedback : q.gentleFeedback,
      hint: null,
      locked: true,
    };
  }

  validateChronoOrder(state: GameAState, placedOrder: string[]): GameAState {
    if (state.locked || state.finished) return state;
    this.stopHintTimer();
    const q = this.getQuestion(state);
    if (q.type !== 'chrono-order' || !q.correctOrder?.length) return state;
    const isCorrect =
      placedOrder.length === q.correctOrder.length &&
      placedOrder.every((stepId, index) => stepId === q.correctOrder![index]);
    return {
      ...state,
      selectedChoiceId: null,
      feedback: isCorrect ? q.goodFeedback : q.gentleFeedback,
      hint: null,
      locked: true,
    };
  }

  showHint(state: GameAState): GameAState {
    if (state.finished || state.locked) return state;
    const q = this.getQuestion(state);
    return {
      ...state,
      hint: q.hint,
      feedback: 'Prenez votre temps, un indice peut aider.',
    };
  }

  skip(state: GameAState): GameAState {
    if (state.finished) return state;
    this.stopHintTimer();
    return {
      ...state,
      feedback: 'Très bien, on passe à la question suivante.',
      hint: null,
      locked: true,
      selectedChoiceId: null,
    };
  }

  next(state: GameAState): GameAState {
    if (state.finished) return state;
    const nextIndex = state.index + 1;
    if (nextIndex >= state.questions.length) {
      return {
        ...state,
        finished: true,
        locked: true,
        feedback: 'Séance terminée. Merci pour votre participation 🌿',
        hint: null,
      };
    }
    return {
      ...state,
      index: nextIndex,
      feedback: null,
      hint: null,
      locked: false,
      selectedChoiceId: null,
    };
  }

  private buildQuestionSequence(profile: PatientProfile): GameAQuestion[] {
    const qCount = Number(profile.questionCount || 5);
    const aCount = Number(profile.answerCount || 3);

    let multipleChoice = this.shuffle([...MULTIPLE_CHOICE_QUESTIONS]);
    const chronoOrder = this.shuffle([...CHRONO_ORDER_QUESTIONS]);

    // Limit answerCount for multiple choice
    multipleChoice = multipleChoice.map(q => {
      if (!q.choices || !q.correctChoiceId) return q;
      const correctChoice = q.choices.find(c => c.id === q.correctChoiceId)!;
      const others = q.choices.filter(c => c.id !== q.correctChoiceId).sort(() => Math.random() - 0.5);
      
      // Dynamic choice pool management
      const availableOthers = [...others];
      // If we need more others than available in the question (shouldn't happen with updated mocks but let's be safe)
      const limitedOthers = availableOthers.slice(0, Math.min(aCount - 1, availableOthers.length));
      
      const finalChoices = this.shuffle([correctChoice, ...limitedOthers]);
      return { ...q, choices: finalChoices as GameAChoice[] };
    });

    const combined = this.shuffle([...multipleChoice, ...chronoOrder]);
    return combined.slice(0, qCount);
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

const MULTIPLE_CHOICE_QUESTIONS: GameAQuestion[] = [
  {
    id: 'q01',
    type: 'multiple-choice',
    prompt: 'Quel objet va naturellement avec cette tasse ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q01/prompt-tasse.png',
    choices: [
      { id: 'a', label: 'Soucoupe', image: 'assets/games/game-a/questions/questions-choix-multiple/q01/soucoupe.png' },
      { id: 'b', label: 'Sous-plat', image: 'assets/games/game-a/questions/questions-choix-multiple/q01/sous-plat.png' },
      { id: 'c', label: 'Petite assiette', image: 'assets/games/game-a/questions/questions-choix-multiple/q01/petite-assiette.png' },
      { id: 'd' as any, label: 'Verre', image: 'assets/game-daily/choix_verre.png' },
    ],
    correctChoiceId: 'a',
    hint: 'on la place souvent sous une tasse.',
    goodFeedback: 'Très bien !',
    gentleFeedback: 'Pas de souci, on continue calmement.',
  },
  {
    id: 'q02',
    type: 'multiple-choice',
    prompt: 'Pour l\'hygiène dentaire, quel objet accompagne cette brosse à dents ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q02/prompt-dentifrice.png',
    choices: [
      { id: 'a', label: 'Dentifrice', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/choix-a.png' },
      { id: 'b', label: 'Brosse à cheveux', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/brosse-a-cheveux.png' },
      { id: 'c', label: 'Savon', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/Savon.png' },
      { id: 'd' as any, label: 'Peigne', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/peigne.png' },
    ],
    correctChoiceId: 'a',
    hint: 'c\'est un tube utilisé avec la brosse.',
    goodFeedback: 'Exact.',
    gentleFeedback: 'Ce n\'est pas grave, on avance ensemble.',
  },
  {
    id: 'q03',
    type: 'multiple-choice',
    prompt: 'Cette clé sert surtout avec…',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q03/prompt-cle.png',
    choices: [
      { id: 'a', label: 'Une porte', image: 'assets/games/game-a/questions/questions-choix-multiple/q03/porte.png' },
      { id: 'b', label: 'Une fenêtre', image: 'assets/games/game-a/questions/questions-choix-multiple/q03/fenetre.png' },
      { id: 'c', label: 'Un coffre-fort', image: 'assets/games/game-a/questions/questions-choix-multiple/q03/coffre-fort.png' },
      { id: 'd' as any, label: 'Une boîte', image: 'assets/games/game-a/questions/questions-choix-multiple/q03/boite.png' },
    ],
    correctChoiceId: 'a',
    hint: 'on l\'utilise pour entrer chez soi.',
    goodFeedback: 'Très bon repère.',
    gentleFeedback: 'D\'accord, on poursuit tranquillement.',
  },
  {
    id: 'q04',
    type: 'multiple-choice',
    prompt: 'Après usage, où range-t-on le mieux ces lunettes ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q04/prompt-lunettes.png',
    choices: [
      { id: 'a', label: 'Étui à lunettes', image: 'assets/games/game-a/questions/questions-choix-multiple/q04/etui-a-lunettes.png' },
      { id: 'b', label: 'Portefeuille', image: 'assets/games/game-a/questions/questions-choix-multiple/q04/portefeuille.png' },
      { id: 'c', label: 'Coque de téléphone', image: 'assets/games/game-a/questions/questions-choix-multiple/q04/Coque-de-telephone.png' },
      { id: 'd' as any, label: 'Sac', image: 'assets/games/game-a/questions/questions-choix-multiple/q04/sac.png' },
    ],
    correctChoiceId: 'a',
    hint: 'cet objet protège les lunettes.',
    goodFeedback: 'Parfait.',
    gentleFeedback: 'Très bien, on continue.',
  },
  {
    id: 'q05',
    type: 'multiple-choice',
    prompt: 'Cette télécommande est utilisée avec…',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q05/prompt-Telecommande.png',
    choices: [
      { id: 'a', label: 'Télévision', image: 'assets/games/game-a/questions/questions-choix-multiple/q05/Television.png' },
      { id: 'b', label: 'Radio', image: 'assets/games/game-a/questions/questions-choix-multiple/q05/radio.png' },
      { id: 'c', label: 'Lampe', image: 'assets/games/game-a/questions/questions-choix-multiple/q05/lampe.png' },
      { id: 'd' as any, label: 'Ventilateur', image: 'assets/games/game-a/questions/questions-choix-multiple/q05/ventilateur.png' },
    ],
    correctChoiceId: 'a',
    hint: 'elle sert à changer de chaîne.',
    goodFeedback: 'Oui, exact.',
    gentleFeedback: 'Pas de problème, on continue.',
  },
  {
    id: 'q06',
    type: 'multiple-choice',
    prompt: 'Cet arrosoir est fait pour…',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q06/prompt-arrosoir.png',
    choices: [
      { id: 'a', label: 'Arroser une plante', image: 'assets/games/game-a/questions/questions-choix-multiple/q06/arroser-une-plante.png' },
      { id: 'b', label: 'Remplir un vase', image: 'assets/games/game-a/questions/questions-choix-multiple/q06/remplire-une-vase.png' },
      { id: 'c', label: 'Nettoyer un seau', image: 'assets/games/game-a/questions/questions-choix-multiple/q06/Nettoyer-un-seau.png' },
      { id: 'd' as any, label: 'Laver la voiture', image: 'assets/games/game-a/questions/questions-choix-multiple/q06/laver-la-voiture.png' },
    ],
    correctChoiceId: 'a',
    hint: 'on l\'utilise pour les plantes.',
    goodFeedback: 'Très bien.',
    gentleFeedback: 'Ce n\'est pas grave, on continue.',
  },
  {
    id: 'q07',
    type: 'multiple-choice',
    prompt: 'On utilise ce parapluie surtout quand il y a…',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q07/prompt-parapluie.png',
    choices: [
      { id: 'a', label: 'De la pluie', image: 'assets/games/game-a/questions/questions-choix-multiple/q07/de-la-peluie.png' },
      { id: 'b', label: 'Du soleil', image: 'assets/games/game-a/questions/questions-choix-multiple/q07/du-soleil.png' },
      { id: 'c', label: 'De la neige', image: 'assets/games/game-a/questions/questions-choix-multiple/q07/de-la-niege.png' },
      { id: 'd' as any, label: 'Du vent', image: 'assets/games/game-a/questions/questions-choix-multiple/q07/du-vent.png' },
    ],
    correctChoiceId: 'a',
    hint: 'il protège de l\'eau qui tombe du ciel.',
    goodFeedback: 'Très bon choix.',
    gentleFeedback: 'Pas grave, on continue.',
  },
  {
    id: 'q08',
    type: 'multiple-choice',
    prompt: 'Pour prendre ce médicament confortablement, on choisit plutôt…',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q08/prompt-medicament.png',
    choices: [
      { id: 'a', label: 'Un verre d\'eau', image: 'assets/games/game-a/questions/questions-choix-multiple/q08/eau.png' },
      { id: 'b', label: 'Un café', image: 'assets/games/game-a/questions/questions-choix-multiple/q08/cafe.png' },
      { id: 'c', label: 'Un jus', image: 'assets/games/game-a/questions/questions-choix-multiple/q08/jus.png' },
      { id: 'd' as any, label: 'Une soupe', image: 'assets/games/game-a/questions/questions-choix-multiple/q08/soupe.png' },
    ],
    correctChoiceId: 'a',
    hint: 'la boisson neutre est préférable.',
    goodFeedback: 'Excellent.',
    gentleFeedback: 'On avance doucement.',
  },
  {
    id: 'q09',
    type: 'multiple-choice',
    prompt: 'Pour lire ce livre dans de bonnes conditions, quel objet aide le plus ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q09/prompt-livre.png',
    choices: [
      { id: 'a', label: 'Lampe de lecture', image: 'assets/games/game-a/questions/questions-choix-multiple/q09/lampe-de-lecteur.png' },
      { id: 'b', label: 'Bougie', image: 'assets/games/game-a/questions/questions-choix-multiple/q09/bougie.png' },
      { id: 'c', label: 'Lampe torche', image: 'assets/games/game-a/questions/questions-choix-multiple/q09/lampe-torche.png' },
      { id: 'd' as any, label: 'Lustre', image: 'assets/games/game-a/questions/questions-choix-multiple/q09/lustre.png' },
    ],
    correctChoiceId: 'a',
    hint: 'elle éclaire de façon confortable pour lire.',
    goodFeedback: 'Parfait.',
    gentleFeedback: 'Très bien, on continue.',
  },
];

const CHRONO_ORDER_QUESTIONS: GameAQuestion[] = [
  {
    id: 'q10',
    type: 'chrono-order',
    prompt: 'Placez les étapes dans l\'ordre chronologique pour préparer un café.',
    promptImage: 'assets/games/game-a/questions/questions-ordre-chrono/q01/q01-step1.png',
    steps: [
      { id: 'q10-s1', image: 'assets/games/game-a/questions/questions-ordre-chrono/q01/q01-step1.png' },
      { id: 'q10-s2', image: 'assets/games/game-a/questions/questions-ordre-chrono/q01/q01-step2.png' },
      { id: 'q10-s3', image: 'assets/games/game-a/questions/questions-ordre-chrono/q01/q01-step3.png' },
      { id: 'q10-s4', image: 'assets/games/game-a/questions/questions-ordre-chrono/q01/q01-step4.png' },
    ],
    correctOrder: ['q10-s1', 'q10-s2', 'q10-s3', 'q10-s4'],
    hint: 'Commencez par la toute première action de la séquence.',
    goodFeedback: 'Excellent ordre chronologique !',
    gentleFeedback: 'Pas de souci, on continue ensemble.',
  },
  {
    id: 'q11',
    type: 'chrono-order',
    prompt: 'Replacez ces images dans le bon ordre pour envoyer une lettre.',
    promptImage: 'assets/games/game-a/questions/questions-ordre-chrono/q02/q02-step1.png',
    steps: [
      { id: 'q11-s1', image: 'assets/games/game-a/questions/questions-ordre-chrono/q02/q02-step1.png' },
      { id: 'q11-s2', image: 'assets/games/game-a/questions/questions-ordre-chrono/q02/q02-step2.png' },
      { id: 'q11-s3', image: 'assets/games/game-a/questions/questions-ordre-chrono/q02/q02-step3.png' },
      { id: 'q11-s4', image: 'assets/games/game-a/questions/questions-ordre-chrono/q02/q02-step4.png' },
    ],
    correctOrder: ['q11-s1', 'q11-s2', 'q11-s3', 'q11-s4'],
    hint: 'Repérez l\'image qui décrit le tout début.',
    goodFeedback: 'Bravo, l\'ordre est parfait.',
    gentleFeedback: 'Très bien, on avance tranquillement.',
  },
  {
    id: 'q12',
    type: 'chrono-order',
    prompt: 'Choisissez l\'ordre logique de ces 4 étapes pour planter une fleur.',
    promptImage: 'assets/games/game-a/questions/questions-ordre-chrono/q03/q03-step1.png',
    steps: [
      { id: 'q12-s1', image: 'assets/games/game-a/questions/questions-ordre-chrono/q03/q03-step1.png' },
      { id: 'q12-s2', image: 'assets/games/game-a/questions/questions-ordre-chrono/q03/q03-step2.png' },
      { id: 'q12-s3', image: 'assets/games/game-a/questions/questions-ordre-chrono/q03/q03-step3.png' },
      { id: 'q12-s4', image: 'assets/games/game-a/questions/questions-ordre-chrono/q03/q03-step4.png' },
    ],
    correctOrder: ['q12-s1', 'q12-s2', 'q12-s3', 'q12-s4'],
    hint: 'Cherchez ce qui se passe avant toutes les autres étapes.',
    goodFeedback: 'Très bon enchaînement !',
    gentleFeedback: 'Ce n\'est pas grave, on continue.',
  },
  {
    id: 'q13',
    type: 'chrono-order',
    prompt: 'Remettez les actions dans leur ordre naturel pour nourrir le chat.',
    promptImage: 'assets/games/game-a/questions/questions-ordre-chrono/q04/q04-step1.png',
    steps: [
      { id: 'q13-s1', image: 'assets/games/game-a/questions/questions-ordre-chrono/q04/q04-step1.png' },
      { id: 'q13-s2', image: 'assets/games/game-a/questions/questions-ordre-chrono/q04/q04-step2.png' },
      { id: 'q13-s3', image: 'assets/games/game-a/questions/questions-ordre-chrono/q04/q04-step3.png' },
      { id: 'q13-s4', image: 'assets/games/game-a/questions/questions-ordre-chrono/q04/q04-step4.png' },
    ],
    correctOrder: ['q13-s1', 'q13-s2', 'q13-s3', 'q13-s4'],
    hint: 'Pensez à la première action indispensable.',
    goodFeedback: 'Parfait, ordre respecté.',
    gentleFeedback: 'On garde le rythme, c\'est très bien.',
  },
];
