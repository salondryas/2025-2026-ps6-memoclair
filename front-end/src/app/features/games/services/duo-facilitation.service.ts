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
      r('image', 'assets/games/game-b/questions/q10/Scrabble.png', 'Jeu de Scrabble',
        'Quel jeu de lettres vous reunissait ?', 'Qui gagnait souvent ?',
        ["Ses parties de Scrabble", "Ses parties de cartes"],
        ["Mes parties de Scrabble", "Mes parties de cartes"],
        "Vous aviez une belle strategie au Scrabble !"),
      r('image', 'assets/games/game-b/questions/q11/Appareil-photo.png', 'Appareil photo',
        'Qui prenait les photos avec cet appareil ?', 'Quel moment capturiez-vous ?',
        ["Son appareil photo", "Son projecteur"],
        ["Mon appareil photo", "Mon projecteur"],
        "Ces photos sont de precieux tresors de memoire."),
      r('image', 'assets/games/game-b/questions/q12/Magnetophone.png', 'Magnetophone',
        'Quel appareil vous permettait d\'ecouter vos chansons ?', 'Qui choisissait la musique ?',
        ["Son magnetophone", "Son lecteur de disques"],
        ["Mon magnetophone", "Mon lecteur de disques"],
        "Vous aviez d\'excellentes collections de cassettes !"),
      r('audio', 'assets/games/game-b/questions/q13/Grosses-tetes-RTL.mp3', 'Les Grosses Tetes',
        'Ecoutez cet extrait culte. Quel jeu radio vous faisait rire ?', 'Qui l\'ecoutait avec vous ?',
        ["Le jeu des Grosses Tetes", "Le jeu des 1000 Francs"],
        ["Le jeu des Grosses Tetes", "Le jeu des 1000 Francs"],
        "Quel moment de detente et de rires partages !"),
      r('image', 'assets/games/game-b/questions/q14/Calculatrice.png', 'Calculatrice',
        'Qui utilisait cette calculatrice pour les comptes ?', 'Pour quel usage ?',
        ["Sa calculatrice de poche", "Son boulier"],
        ["Ma calculatrice de poche", "Mon boulier"],
        "Elle vous a bien aide pour les calculs du quotidien."),
      r('image', 'assets/games/game-b/questions/q15/Montre.png', 'Montre mecanique',
        'Quelle montre portiez-vous au poignet ?', 'Qui vous l\'avait offerte ?',
        ["Sa montre mecanique", "Son chronometre"],
        ["Ma montre mecanique", "Mon chronometre"],
        "Cette montre vous a accompagne pendant longtemps."),
      r('image', 'assets/games/game-b/questions/q16/Stylo-Bic.png', 'Stylo Bic',
        'Quel stylo utilisiez-vous pour ecrire vos lettres ?', 'De quelle couleur ?',
        ["Son stylo Bic bleu", "Son stylo Parker"],
        ["Mon stylo Bic bleu", "Mon stylo Parker"],
        "Le fidele Bic bleu, compagnon de tous les ecoliers !"),
      r('image', 'assets/games/game-b/questions/q17/Lampe-bureau.png', 'Lampe de bureau',
        'Quelle lampe eclairait votre espace de travail ?', 'Ou l\'aviez-vous placee ?',
        ["Sa lampe de bureau", "Son lustre"],
        ["Ma lampe de bureau", "Mon lustre"],
        "Elle creait une belle ambiance pour travailler."),
      r('image', 'assets/games/game-b/questions/q18/Disque-vinyle.png', 'Disque vinyle',
        'Quel format musical ecoutiez-vous ensemble ?', 'Quel etait votre artiste prefere ?',
        ["Ses disques vinyles", "Ses cassettes"],
        ["Mes disques vinyles", "Mes cassettes"],
        "Ces melodies vous rameneront a de beaux souvenirs."),
      r('image', 'assets/games/game-b/questions/q19/Chaise-cuisine.png', 'Chaise de cuisine',
        'Ou vous asseyiez-vous pour les repas en famille ?', 'Qui s\'asseyait a cote de vous ?',
        ["A la table avec ses chaises colorees", "Au comptoir"],
        ["A la table avec mes chaises colorees", "Au comptoir"],
        "Ces moments autour de la table restent inoubliables."),
      r('image', 'assets/games/game-b/questions/q20/Horloge-murale.png', 'Horloge murale',
        'Quelle horloge indiquait l\'heure dans votre cuisine ?', 'Vous la regardiez souvent ?',
        ["Son horloge murale vintage", "Son coucou suisse"],
        ["Mon horloge murale vintage", "Mon coucou suisse"],
        "Elle marquait le rythme de vos journees en famille."),
    ];
  }
}
