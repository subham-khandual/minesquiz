import {
  saveCandidateAccount,
  verifyCandidateCredentials,
  saveStudentResetOtp,
  verifyStudentResetOtp,
  updateCandidatePassword,
  verifyStudentResetToken,
} from '../../../../apps/web/src/lib/studentAuthStore';
import fs from 'fs';
import path from 'path';

describe('Candidate Auth: One-Time OTP, Direct Login, and Forgot Password Recovery', () => {
  const testEmail = 'candidate.statutory@minesquiz.com';
  const initialPassword = 'InitialCandidate#2026';
  const newPassword = 'NewCandidateSecret@2026';

  test('1. Initial Registration: candidate account is saved with scrypt salted hash', () => {
    const saveRes = saveCandidateAccount(testEmail, 'Statutory Candidate', initialPassword);
    expect(saveRes.success).toBe(true);
    expect(saveRes.candidate).toBeDefined();
    expect(saveRes.candidate?.email).toBe(testEmail);
    expect(saveRes.candidate?.passwordHash).toBeDefined();
    expect(saveRes.candidate?.passwordSalt).toBeDefined();
    expect(saveRes.candidate?.passwordHash).not.toBe(initialPassword);
  });

  test('2. Routine Direct Sign-In: candidate authenticates directly with Email + Password (NO OTP REQUIRED)', () => {
    // Valid password -> instant success
    const authSuccess = verifyCandidateCredentials(testEmail, initialPassword);
    expect(authSuccess.success).toBe(true);
    expect(authSuccess.candidate?.email).toBe(testEmail);
    expect(authSuccess.candidate?.fullName).toBe('Statutory Candidate');

    // Incorrect password -> rejected
    const authFailed = verifyCandidateCredentials(testEmail, 'WrongPassword123!');
    expect(authFailed.success).toBe(false);
    expect(authFailed.error).toContain('Incorrect password');
  });

  test('3. Forgot Password Flow: Dispatches 6-digit Reset OTP and generates single-use resetToken', () => {
    const otp = '842615';
    const beaconToken = saveStudentResetOtp(testEmail, otp, 600);

    expect(typeof beaconToken).toBe('string');
    expect(beaconToken.length).toBeGreaterThan(10);

    // Wrong OTP -> rejected
    const wrongVerify = verifyStudentResetOtp(testEmail, '111111');
    expect(wrongVerify.success).toBe(false);
    expect(wrongVerify.error).toContain('Invalid verification code');

    // Correct OTP -> returns single-use resetToken
    const validVerify = verifyStudentResetOtp(testEmail, otp);
    expect(validVerify.success).toBe(true);
    expect(typeof validVerify.resetToken).toBe('string');
    expect(validVerify.resetToken?.startsWith('creset_')).toBe(true);

    const token = validVerify.resetToken!;
    expect(verifyStudentResetToken(testEmail, token)).toBe(true);

    // 4. Update Password with resetToken
    const updateRes = updateCandidatePassword(testEmail, token, newPassword);
    expect(updateRes.success).toBe(true);

    // Token is consumed and invalid for repeat usage
    expect(verifyStudentResetToken(testEmail, token)).toBe(false);

    // Old password no longer works
    const oldAuth = verifyCandidateCredentials(testEmail, initialPassword);
    expect(oldAuth.success).toBe(false);

    // New password successfully authenticates
    const newAuth = verifyCandidateCredentials(testEmail, newPassword);
    expect(newAuth.success).toBe(true);
    expect(newAuth.candidate?.email).toBe(testEmail);
  });

  test('4. Enforces strict zero em-dash compliance per Senior Developer Protocol', () => {
    const files = [
      'apps/web/src/lib/studentAuthStore.ts',
      'apps/web/src/lib/emailTransporter.ts',
      'apps/web/src/components/auth/LoginModal.tsx',
      'apps/web/src/app/api/auth/student/forgot-password/send-otp/route.ts',
      'apps/web/src/app/api/auth/student/forgot-password/verify-otp/route.ts',
      'apps/web/src/app/api/auth/student/forgot-password/reset/route.ts',
      'apps/web/src/app/api/auth/student/login/route.ts',
    ];

    files.forEach((file) => {
      const fullPath = path.resolve(__dirname, '../../../../', file);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toContain('\u2014'); // em-dash
      expect(content).not.toContain('\u2013'); // en-dash
    });
  });
});
