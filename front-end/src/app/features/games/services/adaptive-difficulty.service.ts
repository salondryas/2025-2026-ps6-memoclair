import { Injectable } from '@angular/core';
import { PatientProfile } from '../../../models/patient.model';
import { SessionSummary } from '../../../models/session.model';

export interface DifficultyAdjustment {
  previousDifficulty: PatientProfile['difficulty'];
  newDifficulty: PatientProfile['difficulty'];
  reason: string;
  performanceScore: number;
}

@Injectable({ providedIn: 'root' })
export class AdaptiveDifficultyService {
  /**
   * Analyzes session performance and recommends difficulty adjustment
   * Performance score: 0-100
   * - 0-30: Struggling (decrease difficulty)
   * - 30-70: Appropriate (maintain difficulty)
   * - 70-100: Excelling (increase difficulty)
   */
  analyzeDifficulty(profile: PatientProfile, sessions: SessionSummary[]): DifficultyAdjustment | null {
    if (sessions.length === 0) return null;

    const recentSessions = sessions.slice(-5); // Last 5 sessions
    const performanceScore = this.calculatePerformanceScore(recentSessions);

    const currentDifficulty = profile.difficulty;
    let newDifficulty = currentDifficulty;
    let reason = '';

    if (performanceScore < 30) {
      // Struggling - decrease difficulty
      if (currentDifficulty === 'difficile') {
        newDifficulty = 'moyen';
        reason = 'Performance faible - réduction de la difficulté recommandée';
      } else if (currentDifficulty === 'moyen') {
        newDifficulty = 'facile';
        reason = 'Performance faible - réduction de la difficulté recommandée';
      }
    } else if (performanceScore > 70) {
      // Excelling - increase difficulty
      if (currentDifficulty === 'facile') {
        newDifficulty = 'moyen';
        reason = 'Performance excellente - augmentation de la difficulté recommandée';
      } else if (currentDifficulty === 'moyen') {
        newDifficulty = 'difficile';
        reason = 'Performance excellente - augmentation de la difficulté recommandée';
      }
    } else {
      // Appropriate - maintain
      return null;
    }

    if (newDifficulty === currentDifficulty) {
      return null;
    }

    return {
      previousDifficulty: currentDifficulty,
      newDifficulty,
      reason,
      performanceScore,
    };
  }

  private calculatePerformanceScore(sessions: SessionSummary[]): number {
    if (sessions.length === 0) return 50;

    let totalScore = 0;

    for (const session of sessions) {
      // Accuracy: correct answers / total questions
      const totalQuestions = session.hintCount + session.guidedMoments + session.wrongAnswers + (session.skippedMoments || 0);
      const correctAnswers = totalQuestions - session.wrongAnswers;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Support level: lower is better
      const supportScore = session.supportLevel === 'leger' ? 100 : session.supportLevel === 'modere' ? 60 : 20;

      // Emotional state: engaged is best
      const emotionalScore = session.emotionalState === 'engage' ? 100 : session.emotionalState === 'apaise' ? 80 : 40;

      // Combined score
      const sessionScore = (accuracy * 0.5 + supportScore * 0.3 + emotionalScore * 0.2);
      totalScore += sessionScore;
    }

    return Math.round(totalScore / sessions.length);
  }

  /**
   * Applies difficulty adjustment to profile
   */
  applyDifficulty(profile: PatientProfile, newDifficulty: PatientProfile['difficulty']): PatientProfile {
    const adjustedProfile = { ...profile, difficulty: newDifficulty };

    // Adjust question count based on difficulty
    if (newDifficulty === 'facile') {
      adjustedProfile.questionCount = 5;
      adjustedProfile.answerCount = 2;
      adjustedProfile.hintDelaySeconds = 10;
    } else if (newDifficulty === 'moyen') {
      adjustedProfile.questionCount = 10;
      adjustedProfile.answerCount = 3;
      adjustedProfile.hintDelaySeconds = 20;
    } else if (newDifficulty === 'difficile') {
      adjustedProfile.questionCount = 15;
      adjustedProfile.answerCount = 4;
      adjustedProfile.hintDelaySeconds = 30;
    }

    return adjustedProfile;
  }
}
