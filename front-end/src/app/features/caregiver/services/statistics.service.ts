import { Injectable } from '@angular/core';

import { PatientId } from '../../../models/patient.model';
import { SessionResult, SupportLevel } from '../../../models/session.model';

export interface SessionHistoryItem {
  sessionId: string;
  dateLabel: string;
  gameLabel: string;
  durationLabel: string;
  supportLabel: string;
  supportClass: 'support-soft' | 'support-mid' | 'support-high';
  indicators: string[];
}

export interface SessionDonutStats {
  completionPct: number;
  completedCount: number;
  totalCount: number;
  hintsPct: number;
  guidancePct: number;
  earlyStopPct: number;
  totalSupportSignals: number;
  gameAPct: number;
  gameBPct: number;
  gameDuoPct: number;
}

@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private readonly mockSessions: SessionResult[] = [];

  recordSession(session: SessionResult): void {
    this.mockSessions.unshift(session);
  }

  getSessionsForPatient(patientId: PatientId): SessionResult[] {
    return this.mockSessions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
      .map((s) => ({ ...s, observation: { ...s.observation } }));
  }

  buildDonutStats(patientId: PatientId): SessionDonutStats {
    const sessions = this.getSessionsForPatient(patientId);
    const total = sessions.length || 1;
    const completed = sessions.filter((s) => !s.observation.earlyStop).length;

    const totalHints = sessions.reduce((sum, s) => sum + s.observation.hintCount, 0);
    const totalGuided = sessions.reduce((sum, s) => sum + s.observation.guidedMoments, 0);
    const earlyStops = sessions.filter((s) => s.observation.earlyStop).length;
    const supportTotal = totalHints + totalGuided + earlyStops || 1;

    const gameA = sessions.filter((s) => s.gameType === 'game-a').length;
    const gameB = sessions.filter((s) => s.gameType === 'game-b').length;
    const gameDuo = sessions.filter((s) => s.gameType === 'game-duo').length;

    return {
      completionPct: Math.round((completed / total) * 100),
      completedCount: completed,
      totalCount: sessions.length,
      hintsPct: Math.round((totalHints / supportTotal) * 100),
      guidancePct: Math.round((totalGuided / supportTotal) * 100),
      earlyStopPct: Math.round((earlyStops / supportTotal) * 100),
      totalSupportSignals: totalHints + totalGuided + earlyStops,
      gameAPct: Math.round((gameA / total) * 100),
      gameBPct: Math.round((gameB / total) * 100),
      gameDuoPct: Math.round((gameDuo / total) * 100),
    };
  }

  buildHistoryView(patientId: PatientId): SessionHistoryItem[] {
    return this.getSessionsForPatient(patientId).map((s) => ({
      sessionId: s.id,
      dateLabel: this.formatDate(s.startedAt),
      gameLabel: this.mapGameLabel(s.gameType),
      durationLabel: `${s.durationMinutes} min`,
      supportLabel: `Accompagnement ${this.mapSupportLevel(s.observation.supportLevel)}`,
      supportClass: this.mapSupportClass(s.observation.supportLevel),
      indicators: [
        `Temps moyen avant réponse : ${s.observation.averageLatencySeconds} s`,
        `Erreurs : ${s.observation.wrongAnswers ?? 0}`,
        `Indices déclenchés : ${s.observation.hintCount}`,
        `Moments guidés : ${s.observation.guidedMoments}`,
        `Questions passées : ${s.observation.skippedMoments}`,
        s.observation.earlyStop ? 'Arrêt précoce observé' : "Séance menée jusqu'au bout",
      ],
    }));
  }

  buildClinicalDisclaimer(): string {
    return "Ces repères servent à préparer la prochaine séance. Ils n'ont pas de valeur diagnostique et ne remplacent ni un MMSE, ni une évaluation ADL, ni un avis clinique.";
  }

  private mapSupportClass(level: SupportLevel): 'support-soft' | 'support-mid' | 'support-high' {
    switch (level) {
      case 'leger': return 'support-soft';
      case 'modere': return 'support-mid';
      case 'important': return 'support-high';
    }
  }

  private formatDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  private mapGameLabel(gameType: SessionResult['gameType']): string {
    switch (gameType) {
      case 'game-a': return 'Associations du quotidien';
      case 'game-b': return 'Mémoire & Réminiscence';
      case 'game-duo': return 'Mode duo';
    }
  }

  private mapSupportLevel(level: SupportLevel): string {
    switch (level) {
      case 'leger': return 'léger';
      case 'modere': return 'modéré';
      case 'important': return 'important';
    }
  }

  private mapEmotionalState(state: SessionResult['observation']['emotionalState']): string {
    switch (state) {
      case 'apaise': return 'apaisé';
      case 'engage': return 'engagé';
      case 'variable': return 'variable selon le support';
      case 'fatigue': return 'fatigue rapide';
    }
  }
}
