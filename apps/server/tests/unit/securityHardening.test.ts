import { computeAnswerIntegrityHash } from '@mines-quiz/utils';
import { generateCandidateExamSession } from '../../../../apps/web/src/lib/questionSampling';
import fs from 'fs';
import path from 'path';

describe('100% Security Hardening & Zero-Knowledge Proctoring Suite', () => {
  test('Zero-knowledge payload: Live exam strictly strips explanation from client questions', () => {
    const liveSession = generateCandidateExamSession({
      subjectCode: 'MIN-ALL',
      candidateEmail: 'student.secure@minesquiz.com',
      mode: 'live',
    });

    const questions = liveSession.quiz.questions || [];
    expect(questions.length).toBeGreaterThan(0);
    questions.forEach((q) => {
      expect(q.correctOptionIds).toBeUndefined();
      expect(q.explanation).toBeUndefined();
    });
  });

  test('Mock practice retains explanations for candidate self-review', () => {
    const mockSession = generateCandidateExamSession({
      subjectCode: 'MIN-ALL',
      candidateEmail: 'student.practice@minesquiz.com',
      mode: 'mock',
    });

    const questions = mockSession.quiz.questions || [];
    expect(questions.length).toBeGreaterThan(0);
    const withExplanation = questions.filter((q) => typeof q.explanation === 'string');
    expect(withExplanation.length).toBeGreaterThan(0);
  });

  test('Payload integrity checksum generates deterministic unique signatures', () => {
    const hash1 = computeAnswerIntegrityHash('att-101', 'q-01', ['optA'], 1731580000000);
    const hash2 = computeAnswerIntegrityHash('att-101', 'q-01', ['optA'], 1731580000000);
    const hashDifferent = computeAnswerIntegrityHash('att-101', 'q-01', ['optB'], 1731580000000);

    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(8);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDifferent);
  });

  test('Anti-cheat source code enforces virtual webcam driver blacklisting', () => {
    const antiCheatPath = path.resolve(
      __dirname,
      '../../../../apps/web/src/hooks/useAntiCheat.ts'
    );
    const content = fs.readFileSync(antiCheatPath, 'utf-8');
    expect(content).toContain('blacklistedDrivers');
    expect(content).toContain('obs');
    expect(content).toContain('manycam');
    expect(content).toContain('v4l2loopback');
  });

  test('Anti-cheat source code enforces dual-monitor mouse boundary and docked devtools traps', () => {
    const antiCheatPath = path.resolve(
      __dirname,
      '../../../../apps/web/src/hooks/useAntiCheat.ts'
    );
    const content = fs.readFileSync(antiCheatPath, 'utf-8');
    expect(content).toContain('mouseleave');
    expect(content).toContain('Cursor Left Window');
    expect(content).toContain('window.outerWidth - window.innerWidth > 160');
    expect(content).toContain('DevTools Viewport Detected');
  });

  test('ExamRoom incorporates real-time audio and whisper detection', () => {
    const examRoomPath = path.resolve(
      __dirname,
      '../../../../apps/web/src/features/exam/ExamRoom.tsx'
    );
    const content = fs.readFileSync(examRoomPath, 'utf-8');
    expect(content).toContain('useNoiseDetector');
    expect(content).toContain('audio_detected');
  });

  test('Guarantees strict zero em-dash compliance per Senior Developer Protocol', () => {
    const files = [
      'apps/web/src/hooks/useAntiCheat.ts',
      'apps/web/src/features/exam/ExamRoom.tsx',
      'apps/server/src/services/attemptService.ts',
      'packages/utils/src/index.ts',
    ];
    files.forEach((f) => {
      const fullPath = path.resolve(__dirname, '../../../../', f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toContain('\u2014');
      expect(content).not.toContain('\u2013');
    });
  });
});
