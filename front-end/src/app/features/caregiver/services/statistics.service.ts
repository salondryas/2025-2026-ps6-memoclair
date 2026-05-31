import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { PatientId } from '../../../models/patient.model';
import { SessionResult, SupportLevel } from '../../../models/session.model';
import { environment } from '../../../../environments/environment';


interface BackendStatisticsResponse {
  history: BackendSessionDto[];
}

interface BackendSessionDto {
  id?: string;
  patientId: PatientId;
  gameType?: SessionResult['gameType'];
  startedAt?: string;
  createdAt?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  hintCount?: number;
  skippedCount?: number;
  guidedCount?: number;
  wrongAnswers?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  averageLatencyMs?: number;
  earlyStop?: boolean;
  emotionalState?: SessionResult['observation']['emotionalState'];
  supportLevel?: SupportLevel;
  summary?: string;
}

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

  constructor(private readonly http: HttpClient) {}


  getSessionHistory(patientId: PatientId): Observable<SessionResult[]> {
    return this.http.get<BackendStatisticsResponse>(`${environment.backendUrl}/api/statistics/${patientId}`).pipe(
      map((response) => (response.history ?? []).map((session) => this.mapBackendSession(patientId, session))),
      catchError(() => of(this.getSessionsForPatient(patientId))),
    );
  }

  recordSession(session: SessionResult): void {
    this.mockSessions.unshift(session);
    this.http.post(`${environment.backendUrl}/api/statistics/sessions`, {
      patientId: session.patientId,
      gameType: session.gameType,
      startedAt: session.startedAt,
      durationSeconds: session.durationMinutes * 60,
      hintCount: session.observation.hintCount,
      skippedCount: session.observation.skippedMoments,
      guidedCount: session.observation.guidedMoments,
      wrongAnswers: session.observation.wrongAnswers,
      totalQuestions: session.totalQuestions,
      correctAnswers: session.correctAnswers,
      averageLatencyMs: session.observation.averageLatencySeconds * 1000,
      earlyStop: session.observation.earlyStop,
      emotionalState: session.observation.emotionalState,
    }).subscribe({ error: () => undefined });
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


  private mapBackendSession(patientId: PatientId, session: BackendSessionDto): SessionResult {
    const durationMinutes = session.durationMinutes ?? Math.max(1, Math.round((session.durationSeconds ?? 0) / 60));
    const startedAt = session.startedAt ?? session.createdAt ?? new Date().toISOString();
    const hintCount = Number(session.hintCount ?? 0);
    const skippedMoments = Number(session.skippedCount ?? 0);
    const guidedMoments = Number(session.guidedCount ?? 0);
    const wrongAnswers = Number(session.wrongAnswers ?? 0);
    const totalQuestions = session.totalQuestions ?? Math.max(0, (session.correctAnswers ?? 0) + wrongAnswers + skippedMoments);
    const correctAnswers = session.correctAnswers ?? Math.max(0, totalQuestions - wrongAnswers - skippedMoments);

    return {
      id: session.id ?? `${session.gameType ?? 'game-b'}-${startedAt}`,
      patientId: session.patientId ?? patientId,
      gameType: session.gameType ?? 'game-b',
      startedAt,
      durationMinutes,
      totalQuestions,
      correctAnswers,
      summary: session.summary ?? 'Séance enregistrée dans MemoClair.',
      observation: {
        hintCount,
        guidedMoments,
        skippedMoments,
        wrongAnswers,
        earlyStop: Boolean(session.earlyStop),
        averageLatencySeconds: Math.round(Number(session.averageLatencyMs ?? 0) / 1000),
        supportLevel: session.supportLevel ?? this.computeSupportLevel(hintCount, guidedMoments),
        emotionalState: session.emotionalState ?? 'apaise',
      },
    };
  }

  private computeSupportLevel(hintCount: number, guidedMoments: number): SupportLevel {
    const signals = hintCount + guidedMoments;
    if (signals <= 1) return 'leger';
    if (signals <= 3) return 'modere';
    return 'important';
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
