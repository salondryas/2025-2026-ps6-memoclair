import { Injectable } from '@angular/core';
import { PatientContextService } from '../../../core/services/patient-context.service';
import { CaregiverProfileService } from '../../caregiver/services/caregiver-profile.service';

export interface DuoRound {
  mediaType: 'image' | 'audio';
  mediaSrc: string;
  mediaAlt: string;
  mediaCaption: string;
  question: string;
  helper: string;
  choicesAidant: string[];
  choicesAccueilli: string[];
  correctIndex: number;
  feedbackCorrect: string;
}

export interface DuoState {
  roundIndex: number;
  rounds: DuoRound[];
  aidantChoice: number | null;
  accueilliChoice: number | null;
  showFeedback: boolean;
  agreed: boolean;
  isCorrect: boolean;
  passed: boolean;
  finished: boolean;
}

@Injectable({ providedIn: 'root' })
export class DuoFacilitationService {

  constructor(
    private readonly patientContext: PatientContextService,
    private readonly caregiverProfile: CaregiverProfileService
  ) {}

  createInitialState(): DuoState {
    return {
      roundIndex: 0,
      rounds: this.buildRounds(),
      aidantChoice: null,
      accueilliChoice: null,
      showFeedback: false,
      agreed: false,
      isCorrect: false,
      passed: false,
      finished: false,
    };
  }

  activeRound(state: DuoState): DuoRound {
    return state.rounds[state.roundIndex];
  }

  pickAidant(state: DuoState, index: number): DuoState {
    if (state.showFeedback || state.passed) return state;
    const next = { ...state, aidantChoice: index };
    return this.tryReveal(next);
  }

  pickAccueilli(state: DuoState, index: number): DuoState {
    if (state.showFeedback || state.passed) return state;
    const next = { ...state, accueilliChoice: index };
    return this.tryReveal(next);
  }

  passRound(state: DuoState): DuoState {
    if (state.showFeedback) return state;
    return { ...state, passed: true, showFeedback: true, agreed: false, isCorrect: false };
  }

  answerWithPatient(state: DuoState): DuoState {
    if (state.showFeedback || state.aidantChoice === null) return state;
    const next = { ...state, accueilliChoice: state.aidantChoice };
    return this.tryReveal(next);
  }

  replayRound(state: DuoState): DuoState {
    return {
      ...state,
      aidantChoice: null,
      accueilliChoice: null,
      showFeedback: false,
      agreed: false,
      isCorrect: false,
      passed: false,
    };
  }

  nextRound(state: DuoState): DuoState {
    const nextIndex = state.roundIndex + 1;
    if (nextIndex >= state.rounds.length) {
      return { ...state, finished: true, showFeedback: false };
    }
    return {
      ...state,
      roundIndex: nextIndex,
      aidantChoice: null,
      accueilliChoice: null,
      showFeedback: false,
      agreed: false,
      isCorrect: false,
      passed: false,
    };
  }

  private tryReveal(state: DuoState): DuoState {
    if (state.aidantChoice === null || state.accueilliChoice === null) return state;
    const agreed = state.aidantChoice === state.accueilliChoice;
    const correct = this.activeRound(state).correctIndex;
    const isCorrect = state.aidantChoice === correct && state.accueilliChoice === correct;
    return { ...state, showFeedback: true, agreed, isCorrect };
  }

  private buildRounds(): DuoRound[] {
    const r = (
      mediaType: 'image' | 'audio', mediaSrc: string, mediaAlt: string,
      question: string, helper: string,
      choicesAidant: [string, string], choicesAccueilli: [string, string],
      feedbackCorrect: string,
    ): DuoRound => ({
      mediaType, mediaSrc, mediaAlt, mediaCaption: mediaAlt,
      question, helper, correctIndex: 0,
      choicesAidant, choicesAccueilli, feedbackCorrect,
    });

    return [
      r('image', 'assets/duo/photo_famille.png', 'Photo de famille',
        'Qui voit-on ensemble ici ?', 'Prenez le temps de regarder.',
        ["Isabelle et papa", "Isabelle et son oncle"],
        ["Isabelle et moi", "Isabelle et mon frere"],
        "C'est bien vous deux sur cette photo !"),
      r('audio', 'assets/duo/la-boheme.mp3', 'La Bohème',
        'A qui appartient ce chant ?', 'Ecoutez un moment avant de repondre.',
        ["C'est la chanson de papa", "C'est la chanson d'Isabelle"],
        ["C'est ma chanson", "C'est la chanson d'Isabelle"],
        "Exactement ! Vous l'ecoutiez souvent."),
      r('image', 'assets/duo/photo_mariage.png', 'Photo de mariage',
        'Quel evenement heureux voit-on ?', 'Laissez le souvenir revenir.',
        ["Le mariage de papa", "Le mariage d'Isabelle"],
        ["Mon mariage", "Le mariage d'Isabelle"],
        "Quel beau souvenir !"),
      r('image', 'assets/memory/photo_chien.png', 'Photo d un chien',
        'Quel compagnon reconnait-on ?', 'Ce fidele ami vous rappelle quelque chose ?',
        ["C'est Medor, son chien", "C'est Tobby, son chat"],
        ["C'est Medor, mon chien", "C'est Tobby"],
        "Medor etait un compagnon extraordinaire."),
      r('image', 'assets/memory/photo_radio.png', 'Ancienne radio',
        'Quel objet du foyer est-ce ?', 'Pensez aux habitudes du matin.',
        ["Sa vieille radio", "Son televiseur"],
        ["Ma vieille radio", "Mon televiseur"],
        "On l'ecoutait chaque matin au petit-dejeuner."),
      r('image', 'assets/memory/pomme.png', 'Une pomme',
        'Quel fruit du jardin reconnait-on ?', 'Pensez aux recettes ensemble.',
        ["Ses pommes du jardin", "Ses poires"],
        ["Mes pommes du jardin", "Mes poires"],
        "La tarte aux pommes etait votre specialite !"),
      r('image', 'assets/game-daily/choix_cafetiere.png', 'Une cafetiere',
        'Quel rituel du matin rappelle cet objet ?', 'Qui preparait le cafe ?',
        ["Son cafe du matin", "Son the du soir"],
        ["Mon cafe du matin", "Mon the du soir"],
        "Rien ne valait le cafe prepare a la maison."),
      r('image', 'assets/game-daily/choix_bouilloire.png', 'Une bouilloire',
        'Pour quelle boisson sert cet ustensile ?', 'Pensez aux gouters en famille.',
        ["Pour son the", "Pour son cafe"],
        ["Pour mon the", "Pour mon cafe"],
        "Le the de l'apres-midi etait un moment apaisant."),
      r('image', 'assets/game-daily/choix_assiette.png', 'Une assiette',
        'Quel repas evoque cet objet ?', 'Qui mettait la table ?',
        ["Le diner en famille", "Le petit-dejeuner seul"],
        ["Mon diner en famille", "Mon petit-dejeuner"],
        "C'etait toujours un plaisir autour de la table."),
    ];
  }
}
