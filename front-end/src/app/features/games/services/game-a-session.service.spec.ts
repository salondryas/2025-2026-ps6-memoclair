import { GameASessionService, GameAQuestion } from './game-a-session.service';

describe('GameASessionService', () => {
  let service: GameASessionService;

  beforeEach(() => {
    service = new GameASessionService({} as any, {} as any);
  });

  it('keeps distractors unique and preserves local distractor when enriching choices', () => {
    const question: GameAQuestion = {
      id: 'custom-q',
      type: 'multiple-choice',
      prompt: 'Question test',
      choices: [
        { id: 'a', label: 'Correct', image: 'correct.png' },
        { id: 'b', label: 'Local distractor', image: 'local.png' },
      ],
      correctChoiceId: 'a',
      hint: 'Hint',
      goodFeedback: 'ok',
      gentleFeedback: 'ko',
    };

    spyOn<any>(service, 'getImportedDistractors').and.returnValue([
      { id: 'x1', label: 'Imported 1', image: 'import-1.png', sourceQuestionId: 'q1' },
      { id: 'x2', label: 'Imported 2', image: 'import-2.png', sourceQuestionId: 'q2' },
      { id: 'x3', label: 'Imported 2', image: 'import-2.png', sourceQuestionId: 'q3' },
    ]);
    spyOn<any>(service, 'shuffle').and.callFake((items: unknown[]) => [...items]);

    const prepared = (service as any).prepareMultipleChoiceQuestion(question, 4) as GameAQuestion;
    const correct = prepared.choices?.find((choice) => choice.id === prepared.correctChoiceId);
    const distractors = (prepared.choices ?? []).filter((choice) => choice.id !== prepared.correctChoiceId);

    expect(correct?.label).toBe('Correct');
    expect(distractors.length).toBe(3);
    expect(new Set(distractors.map((choice) => choice.image)).size).toBe(3);
    expect(distractors.some((choice) => choice.image === 'local.png')).toBeTrue();
  });
});
