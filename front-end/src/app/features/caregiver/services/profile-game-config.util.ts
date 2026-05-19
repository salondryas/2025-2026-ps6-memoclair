import { GameBAutoNextMode, PatientProfile } from '../../../models/patient.model';

export function sanitizeProfileGameConfig(
  config: Pick<PatientProfile, 'questionCount' | 'answerCount' | 'hintDelaySeconds' | 'autoNextMode'>,
): Pick<PatientProfile, 'questionCount' | 'answerCount' | 'hintDelaySeconds' | 'autoNextMode'> {
  return {
    questionCount: clampInteger(config.questionCount, 1, 20, 10),
    answerCount: clampInteger(config.answerCount, 2, 4, 3),
    hintDelaySeconds: clampInteger(config.hintDelaySeconds, 1, 30, 20),
    autoNextMode: sanitizeAutoNextMode(config.autoNextMode),
  };
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function sanitizeAutoNextMode(mode: unknown): GameBAutoNextMode {
  if (mode === 'manual' || mode === '5s' || mode === '8s') return mode;
  return '5s';
}
