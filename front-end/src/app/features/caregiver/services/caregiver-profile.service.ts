import { Injectable } from '@angular/core';

import {
  ATTENTION_OPTIONS,
  ClinicalStage,
  MOTOR_OPTIONS,
  MotorLevel,
  PatientId,
  PatientProfile,
  STAGE_OPTIONS,
  THEME_OPTIONS,
  ThemeTag,
  VISION_OPTIONS,
  VisionLevel,
} from '../../../models/patient.model';
import { PatientRepositoryMock } from '../../../mocks/patient-repository.mock';
import { StorageService } from '../../../core/services/storage.service';

const PROFILE_STORAGE_PREFIX = 'mc_caregiver_profile_';

@Injectable({
  providedIn: 'root',
})
export class CaregiverProfileService {
  readonly stageOptions = STAGE_OPTIONS;
  readonly visionOptions = VISION_OPTIONS;
  readonly motorOptions = MOTOR_OPTIONS;
  readonly attentionOptions = ATTENTION_OPTIONS;
  readonly themeOptions = THEME_OPTIONS;

  constructor(
    private readonly storageService: StorageService,
    private readonly patientRepository: PatientRepositoryMock,
  ) {}

  getProfile(patientId: PatientId): PatientProfile {
    const storedProfile = this.storageService.getLocalItem<PatientProfile>(this.getStorageKey(patientId));
    const defaultProfile = this.patientRepository.getDefaultProfile(patientId);

    if (!storedProfile) {
      return defaultProfile;
    }

    return {
      ...defaultProfile,
      ...storedProfile,
      // Ensure fields are numbers and present
      questionCount: Number(storedProfile.questionCount ?? defaultProfile.questionCount),
      answerCount: Number(storedProfile.answerCount ?? defaultProfile.answerCount),
      hintDelaySeconds: Number(storedProfile.hintDelaySeconds ?? defaultProfile.hintDelaySeconds),
      highContrastEnabled: !!(storedProfile.highContrastEnabled ?? defaultProfile.highContrastEnabled),
      themes: [...(storedProfile.themes ?? defaultProfile.themes)],
    };
  }

  saveProfile(profile: PatientProfile): PatientProfile {
    const sanitizedProfile: PatientProfile = {
      ...profile,
      questionCount: Number(profile.questionCount),
      answerCount: Number(profile.answerCount),
      hintDelaySeconds: Number(profile.hintDelaySeconds),
      themes: [...profile.themes],
      updatedAt: new Date().toISOString(),
    };

    this.storageService.setLocalItem(this.getStorageKey(profile.patientId), sanitizedProfile);
    return sanitizedProfile;
  }

  validateProfile(profile: PatientProfile): string[] {
    const errors: string[] = [];
    if (profile.questionCount < 1) errors.push('Le nombre de questions doit être au moins 1.');
    if (profile.questionCount > 13) errors.push('Le nombre de questions ne peut pas dépasser 13.');
    if (profile.answerCount < 2) errors.push('Le nombre de réponses doit être au moins 2.');
    if (profile.hintDelaySeconds < 1) errors.push('Le délai avant indice doit être au moins 1 seconde.');
    if (profile.hintDelaySeconds > 30) errors.push('Le délai avant indice ne peut pas dépasser 30 secondes.');
    return errors;
  }

  buildSummaryLines(profile: PatientProfile): string[] {
    return [
      `Posture conseillée : ${this.mapStageToSummary(profile.stage)}.`,
      `Repères visuels : ${this.mapVisionToSummary(profile.vision)}.`,
      `Interactions : ${this.mapMotorToSummary(profile.motor)}.`,
      `Thèmes à privilégier : ${this.formatThemes(profile.themes)}.`,
      `Nombre de questions : ${profile.questionCount}.`,
      `Nombre de réponses : ${profile.answerCount}.`,
      `Délai avant indice : ${profile.hintDelaySeconds}s.`,
      `Contraste élevé : ${profile.highContrastEnabled ? 'Actif' : 'Inactif'}.`,
      `Durée maximale conseillée : ${profile.attentionSpanMinutes} minutes.`,
    ];
  }

  buildFamilyRecommendations(profile: PatientProfile): string[] {
    const recommendations = profile.themes.map((theme) => this.mapThemeToRecommendation(theme, profile));

    return recommendations.slice(0, 3);
  }

  buildStageGuidance(profile: PatientProfile): string[] {
    const stageGuidanceMap: Record<ClinicalStage, string[]> = {
      leger: [
        'Proposez une consigne courte puis laissez un temps de réponse réel avant de relancer.',
        'Variez les supports doucement, sans changer plusieurs paramètres en même temps.',
      ],
      modere: [
        'Gardez une seule idée à la fois avec des repères très concrets et familiers.',
        'Si l’échange se bloque, reformulez ou passez sans corriger frontalement.',
      ],
      avance: [
        'Privilégiez les formats très courts, les visuels lisibles et les gestes simples.',
        'Restez davantage sur la présence, le ton et l’émotion que sur la justesse.',
      ],
    };

    return stageGuidanceMap[profile.stage];
  }

  getThemeLabel(theme: ThemeTag): string {
    const themeMap = this.createThemeMap();
    return themeMap.get(theme) ?? theme;
  }

  private getStorageKey(patientId: PatientId): string {
    return `${PROFILE_STORAGE_PREFIX}${patientId}`;
  }

  private mapStageToSummary(stage: ClinicalStage): string {
    switch (stage) {
      case 'leger':
        return 'stimulation plus riche avec davantage de variété contextuelle';
      case 'modere':
        return 'repères concrets, contexte simple et rythme apaisé';
      case 'avance':
        return 'formats très courts avec peu de choix et des repères visuels forts';
    }
  }

  private mapVisionToSummary(vision: VisionLevel): string {
    switch (vision) {
      case 'leger':
        return 'texte confortable et contrastes standards';
      case 'modere':
        return 'contraste renforcé et lisibilité prioritaire';
      case 'important':
        return 'grands repères visuels et cibles tactiles très larges';
    }
  }

  private mapMotorToSummary(motor: MotorLevel): string {
    switch (motor) {
      case 'leger':
        return 'interactions simples et rythme souple';
      case 'modere':
        return 'zones tactiles larges et gestes limités';
      case 'important':
        return 'très peu de gestes et beaucoup de temps entre deux actions';
    }
  }

  private formatThemes(themes: ThemeTag[]): string {
    const themeMap = this.createThemeMap();

    return themes.map((theme) => themeMap.get(theme) ?? theme).join(', ');
  }

  private mapThemeToRecommendation(theme: ThemeTag, profile: PatientProfile): string {
    const attentionLabel = `${profile.attentionSpanMinutes} minutes maximum`;

    switch (theme) {
      case 'famille':
        return `Commencez par une photo ou un prénom familier, puis laissez la conversation se construire sur ${attentionLabel}.`;
      case 'quotidien':
        return 'Privilégiez les routines simples, comme préparer la table ou retrouver un objet utile du quotidien.';
      case 'musique':
        return 'Utilisez une musique connue pour ouvrir l’échange, même si aucun mot précis ne vient.';
      case 'enfance':
        return 'Choisissez un souvenir ancien rassurant, avec un lieu ou une ambiance plus qu’une réponse exacte.';
      case 'metier':
        return 'Appuyez-vous sur un geste ou un univers de métier familier plutôt que sur une question fermée.';
      case 'lieux':
        return 'Démarrez par un lieu connu du patient, car ce repère déclenche souvent plus facilement la mémoire.';
    }
  }

  private createThemeMap(): Map<ThemeTag, string> {
    return new Map<ThemeTag, string>([
      ['famille', 'famille'],
      ['quotidien', 'quotidien'],
      ['musique', 'musique'],
      ['enfance', 'enfance'],
      ['metier', 'métier'],
      ['lieux', 'lieux connus'],
    ]);
  }
}
