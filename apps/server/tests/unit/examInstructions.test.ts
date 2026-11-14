import fs from 'fs';
import path from 'path';

describe('Candidate Exam Instructions & Anti-Cheat Specifications', () => {
  const instructionsFilePath = path.resolve(
    __dirname,
    '../../../../apps/web/src/components/candidate/ExamInstructionsView.tsx'
  );

  test('ExamInstructionsView source file exists and is readable', () => {
    expect(fs.existsSync(instructionsFilePath)).toBe(true);
    const content = fs.readFileSync(instructionsFilePath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  test('Guarantees strict zero em-dash compliance per Senior Developer Protocol', () => {
    const content = fs.readFileSync(instructionsFilePath, 'utf-8');
    expect(content).not.toContain('\u2014'); // em-dash —
    expect(content).not.toContain('\u2013'); // en-dash –
  });

  test('Contains all 5 statutory Exam Guidelines matching reference design', () => {
    const content = fs.readFileSync(instructionsFilePath, 'utf-8');
    expect(content).toContain('Ensure a stable internet connection throughout the exam.');
    expect(content).toContain('Keep your face clearly visible via smartphone camera or webcam.');
    expect(content).toContain('Read each question carefully before selecting an answer.');
    expect(content).toContain('Your answers will be auto-saved regularly.');
    expect(content).toContain('Complete the exam within the time limit.');
  });

  test('Contains all 5 statutory Do Not restrictions matching reference design', () => {
    const content = fs.readFileSync(instructionsFilePath, 'utf-8');
    expect(content).toContain('Do not switch apps, minimize, or leave the browser screen.');
    expect(content).toContain('Do not allow any other person in the room.');
    expect(content).toContain('Do not use secondary devices, earphones, or external study aids.');
    expect(content).toContain('Do not look away from the screen for long.');
    expect(content).toContain('Do not try to cheat or use unfair means.');
  });

  test('Enforces interactive agreement checkbox before exam start button becomes active', () => {
    const content = fs.readFileSync(instructionsFilePath, 'utf-8');
    expect(content).toContain('I have read and understood the instructions above.');
    expect(content).toContain('disabled={!hasAgreed || isStarting}');
    expect(content).toContain('Start Exam');
  });

  test('Displays 3D visual hero asset and Important advisory card', () => {
    const content = fs.readFileSync(instructionsFilePath, 'utf-8');
    expect(content).toContain('/images/exam-3d-hero.png');
    expect(content).toContain('Follow these instructions to ensure a smooth and fair exam experience.');
    expect(content).toContain('Secure Exam Environment');
  });
});
