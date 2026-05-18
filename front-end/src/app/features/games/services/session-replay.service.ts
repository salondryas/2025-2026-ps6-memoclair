import { Injectable } from '@angular/core';
import { SessionSummary } from '../../../models/session.model';

export interface SessionInteraction {
  timestamp: number;
  type: 'question' | 'answer' | 'hint' | 'skip' | 'pause' | 'resume';
  questionId?: string;
  answerId?: string;
  duration?: number;
}

export interface ReplayableSession extends SessionSummary {
  interactions: SessionInteraction[];
  recordedAt: string;
}

@Injectable({ providedIn: 'root' })
export class SessionReplayService {
  private sessions: Map<string, ReplayableSession> = new Map();

  /**
   * Records a session with interaction history
   */
  recordSession(session: SessionSummary, interactions: SessionInteraction[]): void {
    const replayableSession: ReplayableSession = {
      ...session,
      interactions,
      recordedAt: new Date().toISOString(),
    };

    const sessionId = `${session.patientId}_${session.startedAt}`;
    this.sessions.set(sessionId, replayableSession);
    this.saveToStorage(sessionId, replayableSession);
  }

  /**
   * Retrieves a recorded session for replay
   */
  getSession(sessionId: string): ReplayableSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Gets all sessions for a patient
   */
  getPatientSessions(patientId: string): ReplayableSession[] {
    return Array.from(this.sessions.values()).filter(
      session => session.patientId === patientId
    );
  }

  /**
   * Generates replay timeline
   */
  generateTimeline(session: ReplayableSession): Array<{ time: string; event: string }> {
    return session.interactions.map(interaction => ({
      time: this.formatTime(interaction.timestamp),
      event: this.describeInteraction(interaction),
    }));
  }

  /**
   * Calculates performance metrics for replay
   */
  calculateMetrics(session: ReplayableSession) {
    const totalInteractions = session.interactions.length;
    const hintCount = session.interactions.filter(i => i.type === 'hint').length;
    const skipCount = session.interactions.filter(i => i.type === 'skip').length;
    const pauseCount = session.interactions.filter(i => i.type === 'pause').length;

    return {
      totalInteractions,
      hintCount,
      skipCount,
      pauseCount,
      engagementScore: this.calculateEngagementScore(session),
    };
  }

  private calculateEngagementScore(session: ReplayableSession): number {
    const baseScore = 100;
    const hintPenalty = session.hintCount * 5;
    const skipPenalty = (session.skippedMoments || 0) * 10;
    const wrongAnswerPenalty = session.wrongAnswers * 3;

    return Math.max(0, baseScore - hintPenalty - skipPenalty - wrongAnswerPenalty);
  }

  private describeInteraction(interaction: SessionInteraction): string {
    switch (interaction.type) {
      case 'question':
        return `Question ${interaction.questionId}`;
      case 'answer':
        return `Réponse: ${interaction.answerId}`;
      case 'hint':
        return 'Indice demandé';
      case 'skip':
        return 'Question passée';
      case 'pause':
        return 'Pause';
      case 'resume':
        return 'Reprise';
      default:
        return 'Événement';
    }
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  private saveToStorage(sessionId: string, session: ReplayableSession): void {
    try {
      const key = `mc_replay_${sessionId}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session replay:', error);
    }
  }
}
