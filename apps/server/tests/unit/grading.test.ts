import { gradeAttempt } from '@mines-quiz/utils';
import { Question, UserAnswer } from '@mines-quiz/types';

describe('Exam Grading Logic', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'q1',
      text: 'What is the capital of France?',
      type: 'mcq',
      options: [
        { id: 'opt1', text: 'Paris' },
        { id: 'opt2', text: 'Berlin' },
      ],
      correctOptionIds: ['opt1'],
      marks: 4,
      negativeMarks: 1,
    },
    {
      id: 'q2',
      text: 'Select all prime numbers',
      type: 'multiple-select',
      options: [
        { id: 'optA', text: '2' },
        { id: 'optB', text: '3' },
        { id: 'optC', text: '4' },
      ],
      correctOptionIds: ['optA', 'optB'],
      marks: 6,
      negativeMarks: 2,
    },
  ];

  it('correctly calculates score for perfect answers', () => {
    const answers: UserAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['opt1'] },
      { questionId: 'q2', selectedOptionIds: ['optA', 'optB'] },
    ];

    const result = gradeAttempt(sampleQuestions, answers);
    expect(result.totalScore).toBe(10);
    expect(result.percentage).toBe(100);
    expect(result.results.every((r) => r.isCorrect)).toBe(true);
  });

  it('applies negative marking when option is incorrect', () => {
    const answers: UserAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['opt2'] }, // wrong (-1)
      { questionId: 'q2', selectedOptionIds: ['optA', 'optB'] }, // correct (+6)
    ];

    const result = gradeAttempt(sampleQuestions, answers);
    expect(result.totalScore).toBe(5);
    expect(result.percentage).toBe(50);
  });
});

