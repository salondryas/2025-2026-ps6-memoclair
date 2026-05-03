import { Injectable } from '@angular/core';

import { PatientId } from '../../../models/patient.model';
import { EmotionalState, SessionGameType, SessionResult, SupportLevel } from '../../../models/session.model';

export interface RawSessionMetrics {
  patientId: PatientId;
  gameType: SessionGameType;
  startedAt: Date | string;
  hintCount: number;
  guidedMoments: number;
  skippedMoments: number;
  wrongAnswers: number;
  earlyStop: boolean;
  latenciesSeconds: number[];
  durationMinutes?: number;
  supportLevel?: SupportLevel;
  emotionalState?: EmotionalState;
  summary?: string;
}

@Injectable({ providedIn: 'root' })
export class SessionSummaryService {
  build(metrics: RawSessionMetrics): SessionResult {
    const startedAt = this.toDate(metrics.startedAt);
    const durationMinutes = metrics.durationMinutes ?? this.computeDurationMinutes(startedAt);
    const averageLatencySeconds = this.computeAverageLatency(metrics.latenciesSeconds);
    const supportLevel = metrics.supportLevel ?? this.computeSupportLevel(metrics.hintCount, metrics.guidedMoments);
    const emotionalState = metrics.emotionalState ?? this.computeEmotionalState(averageLatencySeconds, metrics.guidedMoments, metrics.earlyStop);

    return {
      id: `${metrics.gameType}-${Date.now()}`,
      patientId: metrics.patientId,
      gameType: metrics.gameType,
      startedAt: startedAt.toISOString(),
      durationMinutes,
      summary: metrics.summary ?? this.buildSummaryText(supportLevel, emotionalState, metrics.earlyStop),
      observation: {
        hintCount: metrics.hintCount,
        guidedMoments: metrics.guidedMoments,
        skippedMoments: metrics.skippedMoments,
        wrongAnswers: metrics.wrongAnswers,
        earlyStop: metrics.earlyStop,
        averageLatencySeconds,
        supportLevel,
        emotionalState,
      },
    };
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private computeDurationMinutes(startedAt: Date): number {
    return Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000));
  }

  private computeAverageLatency(latenciesSeconds: number[]): number {
    if (!latenciesSeconds.length) return 0;
    return Math.round(latenciesSeconds.reduce((sum, item) => sum + item, 0) / latenciesSeconds.length);
  }

  private computeSupportLevel(hintCount: number, guidedMoments: number): SupportLevel {
    const totalSignals = hintCount + guidedMoments;
    if (totalSignals <= 1) return 'leger';
    if (totalSignals <= 3) return 'modere';
    return 'important';
  }

  private computeEmotionalState(avgLatency: number, guidedMoments: number, earlyStop: boolean): EmotionalState {
    if (earlyStop) return 'fatigue';
    if (guidedMoments >= 2) return 'variable';
    if (avgLatency <= 8) return 'engage';
    if (avgLatency >= 18) return 'fatigue';
    return 'apaise';
  }

  private buildSummaryText(supportLevel: SupportLevel, emotionalState: EmotionalState, earlyStop: boolean): string {
    if (earlyStop) return 'Séance interrompue — fatigue ou inconfort détecté.';

    const supportText: Record<SupportLevel, string> = {
      leger: 'autonomie globalement bonne',
      modere: 'accompagnement modéré',
      important: 'soutien important',
    };
    const emotionText: Record<EmotionalState, string> = {
      apaise: 'état apaisé',
      engage: 'engagement actif',
      variable: 'engagement variable',
      fatigue: 'signes de fatigue',
    };

    return `Séance complète — ${supportText[supportLevel]}, ${emotionText[emotionalState]}.`;
  }
}
