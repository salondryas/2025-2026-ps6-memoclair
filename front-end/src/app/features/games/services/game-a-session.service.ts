import { Injectable } from '@angular/core';
import { CaregiverProfileService } from '../../caregiver/services/caregiver-profile.service';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { PatientProfile } from '../../../models/patient.model';

export type GameAQuestionType = 'multiple-choice' | 'chrono-order';

export interface GameAChoice {
  id: string;
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
  correctChoiceId?: string;
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
  selectedChoiceId: string | null;
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
      profile,
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

  choose(state: GameAState, choiceId: string): GameAState {
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
    const correctOrder = q.correctOrder;
    const isCorrect =
      placedOrder.length === correctOrder.length &&
      placedOrder.every((stepId, index) => stepId === correctOrder[index]);
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
    const qCount = Math.max(1, Number(profile.questionCount || 5));
    const requestedChoiceCount = Math.max(2, Number(profile.answerCount || 3));

    const multipleChoice = this.shuffle([...MULTIPLE_CHOICE_QUESTIONS]).map((question) =>
      this.prepareMultipleChoiceQuestion(question, requestedChoiceCount),
    );
    const chronoOrder = this.shuffle([...CHRONO_ORDER_QUESTIONS]);

    const combined = this.shuffle([...multipleChoice, ...chronoOrder]);
    return combined.slice(0, qCount);
  }

  private prepareMultipleChoiceQuestion(question: GameAQuestion, requestedChoiceCount: number): GameAQuestion {
    if (question.type !== 'multiple-choice' || !question.choices?.length || !question.correctChoiceId) {
      return question;
    }

    const correctChoice = question.choices.find((choice) => choice.id === question.correctChoiceId);
    if (!correctChoice) return question;

    const targetDistractorsCount = requestedChoiceCount - 1;
    const localDistractors = this.shuffle(
      question.choices.filter((choice) => choice.id !== question.correctChoiceId),
    );

    const allDistractors: GameAChoice[] = [...localDistractors];
    if (localDistractors.length < targetDistractorsCount) {
      const importedDistractors = this.shuffle(this.getImportedDistractors(question.id));
      const usedImages = new Set<string>([
        ...allDistractors.map((choice) => choice.image),
        correctChoice.image,
      ]);

      for (const choice of importedDistractors) {
        if (allDistractors.length >= targetDistractorsCount) break;
        if (usedImages.has(choice.image)) continue;
        usedImages.add(choice.image);
        allDistractors.push({ ...choice });
      }
    }

    const selectedDistractors = allDistractors.slice(0, targetDistractorsCount);
    const shuffledChoices = this.shuffle([correctChoice, ...selectedDistractors]);
    const normalizedChoices = shuffledChoices.map((choice, index) => ({
      ...choice,
      id: this.getChoiceId(index),
    }));

    const normalizedCorrectChoice = normalizedChoices.find(
      (choice) => choice.image === correctChoice.image,
    );
    if (!normalizedCorrectChoice) return question;

    return {
      ...question,
      choices: normalizedChoices,
      correctChoiceId: normalizedCorrectChoice.id,
    };
  }

  private getImportedDistractors(currentQuestionId: string): GameAChoice[] {
    const imported: GameAChoice[] = [];

    for (const question of MULTIPLE_CHOICE_QUESTIONS) {
      if (question.id === currentQuestionId || !question.choices?.length || !question.correctChoiceId) {
        continue;
      }

      const distractors = question.choices.filter((choice) => choice.id !== question.correctChoiceId);
      imported.push(...distractors.map((choice) => ({ ...choice })));
    }

    return imported;
  }

  private getChoiceId(index: number): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    if (index < alphabet.length) {
      return alphabet[index];
    }
    return `choice-${index + 1}`;
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
      { id: 'a', label: 'Dentifrice', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/dentifrice.png' },
      { id: 'b', label: 'Brosse à cheveux', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/brosse-a-cheveux.png' },
      { id: 'c', label: 'Savon', image: 'assets/games/game-a/questions/questions-choix-multiple/q02/Savon.png' },
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
    ],
    correctChoiceId: 'a',
    hint: 'elle éclaire de façon confortable pour lire.',
    goodFeedback: 'Parfait.',
    gentleFeedback: 'Très bien, on continue.',
  },
  {
    id: 'mc-q10',
    type: 'multiple-choice',
    prompt: 'Avec quoi utilisez-vous un timbre ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q10/prompt-timbre.png',
    choices: [
      { id: 'a', label: 'Une enveloppe', image: 'assets/games/game-a/questions/questions-choix-multiple/q10/enveloppe.png' },
      { id: 'b', label: 'Un livre', image: 'assets/games/game-a/questions/questions-choix-multiple/q10/livre.png' },
      { id: 'c', label: 'Un journal', image: 'assets/games/game-a/questions/questions-choix-multiple/q10/journal.png' },
    ],
    correctChoiceId: 'a',
    hint: 'On l\'utilise pour envoyer une lettre par la poste.',
    goodFeedback: 'Très bien.',
    gentleFeedback: 'Pas de souci, on poursuit calmement.',
  },
  {
    id: 'mc-q11',
    type: 'multiple-choice',
    prompt: 'Où posez-vous une casserole pour faire chauffer l\'eau ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q11/prompt-casserole.png',
    choices: [
      { id: 'a', label: 'Sur une cuisinière', image: 'assets/games/game-a/questions/questions-choix-multiple/q11/cuisiniere.png' },
      { id: 'b', label: 'Dans le lave-linge', image: 'assets/games/game-a/questions/questions-choix-multiple/q11/lave-linge.png' },
      { id: 'c', label: 'Sur une chaise', image: 'assets/games/game-a/questions/questions-choix-multiple/q11/chaise.png' },
    ],
    correctChoiceId: 'a',
    hint: 'C\'est l\'appareil qui produit de la chaleur pour cuisiner.',
    goodFeedback: 'Exact.',
    gentleFeedback: 'Ce n\'est pas grave, on continue.',
  },
  {
    id: 'mc-q12',
    type: 'multiple-choice',
    prompt: 'Où placez-vous votre oreiller ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q12/prompt-oreiller.png',
    choices: [
      { id: 'a', label: 'Sur le lit', image: 'assets/games/game-a/questions/questions-choix-multiple/q12/lit.png' },
      { id: 'b', label: 'Sur la table', image: 'assets/games/game-a/questions/questions-choix-multiple/q12/table.png' },
      { id: 'c', label: 'Dans le canapé', image: 'assets/games/game-a/questions/questions-choix-multiple/q12/canape.png' },
    ],
    correctChoiceId: 'a',
    hint: 'C\'est le meuble où l\'on s\'allonge pour dormir.',
    goodFeedback: 'Parfait.',
    gentleFeedback: 'Très bien, on continue ensemble.',
  },
  {
    id: 'mc-q13',
    type: 'multiple-choice',
    prompt: 'Avec quoi ramassez-vous la poussière après avoir passé le balai ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q13/prompt-balai.png',
    choices: [
      { id: 'a', label: 'Une pelle à poussière', image: 'assets/games/game-a/questions/questions-choix-multiple/q13/pelle-a-poussiere.png' },
      { id: 'b', label: 'Une éponge', image: 'assets/games/game-a/questions/questions-choix-multiple/q13/eponge.png' },
      { id: 'c', label: 'Une serviette', image: 'assets/games/game-a/questions/questions-choix-multiple/q13/serviette.png' },
    ],
    correctChoiceId: 'a',
    hint: 'C\'est un petit outil en plastique ou en métal pour recueillir les saletés.',
    goodFeedback: 'Bravo.',
    gentleFeedback: 'On reste serein, on avance.',
  },
  {
    id: 'mc-q14',
    type: 'multiple-choice',
    prompt: 'Sur quoi tapez-vous avec un marteau ?',
    promptImage: 'assets/games/game-a/questions/questions-choix-multiple/q14/prompt-marteau.png',
    choices: [
      { id: 'a', label: 'Un clou', image: 'assets/games/game-a/questions/questions-choix-multiple/q14/clou.png' },
      { id: 'b', label: 'Une vis', image: 'assets/games/game-a/questions/questions-choix-multiple/q14/vis.png' },
      { id: 'c', label: 'Un bouton', image: 'assets/games/game-a/questions/questions-choix-multiple/q14/bouton.png' },
    ],
    correctChoiceId: 'a',
    hint: 'C\'est une petite tige en métal pointue.',
    goodFeedback: 'Très bon choix.',
    gentleFeedback: 'Pas de problème, on continue doucement.',
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
  {
    id: 'chrono-q05',
    type: 'chrono-order',
    prompt: 'Remettez dans l\'ordre les étapes pour se laver les mains :',
    promptImage: 'assets/games/game-a/questions/questions-ordre-chrono/q05/q05-step1.png',
    steps: [
      { id: 's1', image: 'assets/games/game-a/questions/questions-ordre-chrono/q05/q05-step1.png' },
      { id: 's2', image: 'assets/games/game-a/questions/questions-ordre-chrono/q05/q05-step2.png' },
      { id: 's3', image: 'assets/games/game-a/questions/questions-ordre-chrono/q05/q05-step3.png' },
      { id: 's4', image: 'assets/games/game-a/questions/questions-ordre-chrono/q05/q05-step4.png' },
    ],
    correctOrder: ['s1', 's2', 's3', 's4'],
    hint: 'On mouille ses mains d\'abord, on met du savon, on frotte, puis on sèche.',
    goodFeedback: 'Excellent ordre.',
    gentleFeedback: 'Très bien, on reprend tranquillement.',
  },
  {
    id: 'chrono-q06',
    type: 'chrono-order',
    prompt: 'Remettez dans l\'ordre les étapes pour faire la vaisselle :',
    promptImage: 'assets/games/game-a/questions/questions-ordre-chrono/q06/q06-step1.png',
    steps: [
      { id: 's1', image: 'assets/games/game-a/questions/questions-ordre-chrono/q06/q06-step1.png' },
      { id: 's2', image: 'assets/games/game-a/questions/questions-ordre-chrono/q06/q06-step2.png' },
      { id: 's3', image: 'assets/games/game-a/questions/questions-ordre-chrono/q06/q06-step3.png' },
      { id: 's4', image: 'assets/games/game-a/questions/questions-ordre-chrono/q06/q06-step4.png' },
    ],
    correctOrder: ['s1', 's2', 's3', 's4'],
    hint: 'On prépare l\'éponge, on frotte, on rince, puis on sèche à la fin.',
    goodFeedback: 'Parfait.',
    gentleFeedback: 'Ce n\'est pas grave, on continue ensemble.',
  },
];
