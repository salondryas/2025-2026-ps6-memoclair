import { Injectable } from '@angular/core';

import { Hint } from '../../../models/hint.model';
import { MediaItem, MemoryCueType } from '../../../models/media.model';

const CUE_PRIORITY: readonly MemoryCueType[] = ['location', 'person', 'event', 'music'];

@Injectable({
  providedIn: 'root',
})
export class HintService {
  /**
   * Phrases d’accompagnement Jeu B, ordre clinique : indices « lieu » en tête,
   * puis personne / objet ; « musique » en dernier recours.
   */
  buildFromMedia(media: MediaItem): string[] {
    return this.presentOrdered(this.orderHints(this.collectMediaHints(media)));
  }

  buildFromGenericPrompt(promptId: string): string[] {
    const baseId = this.stripMixSuffix(promptId);
    return this.presentOrdered(this.orderHints(this.collectGenericHints(baseId)));
  }

  /** Accès structuré (ex. futur Duo, analytics indices). */
  buildHintObjectsFromMedia(media: MediaItem): Hint[] {
    return this.orderHints(this.collectMediaHints(media));
  }

  buildHintObjectsFromGeneric(promptId: string): Hint[] {
    return this.orderHints(this.collectGenericHints(this.stripMixSuffix(promptId)));
  }

  private stripMixSuffix(id: string): string {
    return id.replace(/-mix$/, '');
  }

  private orderHints(hints: Hint[]): Hint[] {
    const weight = (cue: MemoryCueType) => CUE_PRIORITY.indexOf(cue);
    return [...hints].sort((left, right) => weight(left.cueType) - weight(right.cueType) || left.id.localeCompare(right.id));
  }

  private presentOrdered(hints: Hint[]): string[] {
    return hints.map((hint) => hint.text.trim()).filter((line) => line.length > 0);
  }

  private collectMediaHints(media: MediaItem): Hint[] {
    const hints: Hint[] = [];

    hints.push({
      id: `${media.id}-hint-lieu-cadre`,
      cueType: 'location',
      text: 'Invitez d’abord le lieu ou l’atmosphère : dedans ou dehors, saison, lumière du moment. Aucun nom exact n’est nécessaire.',
    });

    hints.push({
      id: `${media.id}-hint-lieu-parcours`,
      cueType: 'location',
      text: 'Proposez de « se promener » dans le cadre avec les yeux : où posait-on les choses, quel bruit de fond dans le quartier ?',
    });

    if (media.cueType === 'location') {
      hints.push({
        id: `${media.id}-hint-lieu-soutien`,
        cueType: 'location',
        text: `Un petit détail concret de « ${media.title} » peut suffire : odeur, météo, température.`,
      });
    }

    if (media.cueType === 'person') {
      hints.push({
        id: `${media.id}-hint-personne`,
        cueType: 'person',
        text: 'Évoquez une présence sans interroger sur les noms : un geste, une voix, une habitude partagée.',
      });
    }

    if (media.cueType === 'event') {
      hints.push({
        id: `${media.id}-hint-objet`,
        cueType: 'event',
        text: 'Demandez comment cet objet tenait dans la journée, plutôt que de le décrire parfaitement.',
      });
    }

    if (media.cueType === 'music') {
      hints.push({
        id: `${media.id}-hint-musique`,
        cueType: 'music',
        text: 'Un rythme fredonné tout doux peut ouvrir la mémoire sans exiger le titre exact.',
      });
    }

    hints.push({
      id: `${media.id}-hint-note-clinique`,
      cueType: 'event',
      text: media.clinicalNote,
    });

    hints.push({
      id: `${media.id}-hint-personne-silence`,
      cueType: 'person',
      text: 'Laissez un silence confortable : le souvenir peut mettre quelques secondes à se montrer.',
    });

    hints.push({
      id: `${media.id}-hint-passer`,
      cueType: 'event',
      text: 'Si gêne ou fatigue : proposez de passer sans insister — le lien compte plus que la précision.',
    });

    return hints;
  }

  private collectGenericHints(baseId: string): Hint[] {
    switch (baseId) {
      case 'generic-vacances-route':
        return [
          {
            id: `${baseId}-lieu-route`,
            cueType: 'location',
            text: 'Commencez par la route elle-même : chaleur dans la voiture, paysage à la fenêtre, pause sur une aire.',
          },
          {
            id: `${baseId}-lieu-arrivee`,
            cueType: 'location',
            text: 'Ensuite seulement, évoquez l’arrivée ou le logement : l’odeur du lieu, le bruit autour.',
          },
          {
            id: `${baseId}-personne-famille`,
            cueType: 'person',
            text: 'Si le lieu ne parle pas, parlez des visages présents sans demander qui est qui.',
          },
          {
            id: `${baseId}-objet-colis`,
            cueType: 'event',
            text: 'Un bagage, une glacière, une radio : un objet du trajet peut relancer sans pression.',
          },
          {
            id: `${baseId}-musique-radio`,
            cueType: 'music',
            text: 'En dernier recours, une chanson d’époque fredonnée très doucement peut aider.',
          },
        ];
      case 'generic-marche':
        return [
          {
            id: `${baseId}-lieu-place`,
            cueType: 'location',
            text: 'Ancrez d’abord le marché dans l’espace : place du village, rue adjacente, bruit des pas.',
          },
          {
            id: `${baseId}-lieu-etals`,
            cueType: 'location',
            text: 'Décrivez les couleurs et les odeurs des étals avant toute question sur les personnes.',
          },
          {
            id: `${baseId}-personne-vendeur`,
            cueType: 'person',
            text: 'Si besoin, évoquez le marchand sans nom propre : ton de voix, tablier, habitudes.',
          },
          {
            id: `${baseId}-objet-panier`,
            cueType: 'event',
            text: 'Le panier, les sacs, les pièces sonnantes : des objets simples pour relancer.',
          },
          {
            id: `${baseId}-musique-ambiance`,
            cueType: 'music',
            text: 'Ambiance sonore du marché en dernier recours : cris doux, musique lointaine.',
          },
        ];
      case 'generic-musique-salon':
        return [
          {
            id: `${baseId}-lieu-piece`,
            cueType: 'location',
            text: 'Situez d’abord la pièce ou le moment du jour : dimanche matin, cuisine, salon calme.',
          },
          {
            id: `${baseId}-lieu-fenetre`,
            cueType: 'location',
            text: 'Lumière à la fenêtre, bruit de la rue : le lieu porte souvent le souvenir plus que le titre.',
          },
          {
            id: `${baseId}-personne-ecoute`,
            cueType: 'person',
            text: 'Qui écoutait avec lui ou elle, sans viser le prénom exact ?',
          },
          {
            id: `${baseId}-objet-radio`,
            cueType: 'event',
            text: 'Radio, disque, bouton de volume : un geste concret pour entrer dans le souvenir.',
          },
          {
            id: `${baseId}-musique-air`,
            cueType: 'music',
            text: 'Quelques notes fredonnées, sans justesse requise, peuvent suffire en dernier appui.',
          },
        ];
      default:
        return this.defaultGenericHints();
    }
  }

  private defaultGenericHints(): Hint[] {
    return [
      {
        id: 'generic-fallback-lieu',
        cueType: 'location',
        text: 'Commencez par situer un lieu concret : intérieur / extérieur, saison, météo.',
      },
      {
        id: 'generic-fallback-personne',
        cueType: 'person',
        text: 'Puis évoquez une présence ou une voix familière, sans test de mémoire.',
      },
      {
        id: 'generic-fallback-objet',
        cueType: 'event',
        text: 'Un objet du quotidien peut relancer sans exiger de précision.',
      },
    ];
  }
}
