import { sanitizeProfileGameConfig } from './profile-game-config.util';

describe('sanitizeProfileGameConfig', () => {
  it('clamps values to allowed ranges', () => {
    const sanitized = sanitizeProfileGameConfig({
      questionCount: 999,
      answerCount: 1,
      hintDelaySeconds: -3,
      autoNextMode: 'unexpected' as any,
    });

    expect(sanitized.questionCount).toBe(20);
    expect(sanitized.answerCount).toBe(2);
    expect(sanitized.hintDelaySeconds).toBe(1);
    expect(sanitized.autoNextMode).toBe('5s');
  });

  it('normalizes numbers and preserves supported auto-next values', () => {
    const sanitized = sanitizeProfileGameConfig({
      questionCount: 6.8,
      answerCount: 3.2,
      hintDelaySeconds: 7.4,
      autoNextMode: 'manual',
    });

    expect(sanitized.questionCount).toBe(7);
    expect(sanitized.answerCount).toBe(3);
    expect(sanitized.hintDelaySeconds).toBe(7);
    expect(sanitized.autoNextMode).toBe('manual');
  });
});
