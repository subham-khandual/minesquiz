import { isDisposableEmail } from '../../../../apps/web/src/lib/emailValidation';
import {
  saveStudentOtp,
  recordEmailBeaconOpen,
  verifyStudentOtp,
  getStudentOtpEntry,
} from '../../../../apps/web/src/lib/studentAuthStore';
import fs from 'fs';
import path from 'path';

describe('Disposable Email Blocker & Device Open Telemetry Suite', () => {
  test('isDisposableEmail accurately blocks known throwaway and 10-minute mail domains', () => {
    expect(isDisposableEmail('scammer@mailinator.com')).toBe(true);
    expect(isDisposableEmail('cheater@tempmail.com')).toBe(true);
    expect(isDisposableEmail('user@10minutemail.com')).toBe(true);
    expect(isDisposableEmail('bot@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('fake@yopmail.com')).toBe(true);
    expect(isDisposableEmail('burner@sharklasers.com')).toBe(true);
  });

  test('isDisposableEmail permits legitimate permanent email domains', () => {
    expect(isDisposableEmail('student@gmail.com')).toBe(false);
    expect(isDisposableEmail('candidate@yahoo.com')).toBe(false);
    expect(isDisposableEmail('engineer@outlook.com')).toBe(false);
    expect(isDisposableEmail('officer@minesquiz.com')).toBe(false);
    expect(isDisposableEmail('iitkgp@iitkgp.ac.in')).toBe(false);
  });

  test('saveStudentOtp generates unique beaconToken for device open tracking', () => {
    const email = 'beacon.candidate@minesquiz.com';
    const beaconToken = saveStudentOtp(email, 'Beacon Candidate', '987654', 600);

    expect(typeof beaconToken).toBe('string');
    expect(beaconToken.length).toBeGreaterThan(10);

    const entry = getStudentOtpEntry(email);
    expect(entry).toBeDefined();
    expect(entry?.beaconToken).toBe(beaconToken);
    expect(entry?.deviceTelemetry).toBeUndefined();
  });

  test('recordEmailBeaconOpen logs real device telemetry when email is opened on mobile or desktop', () => {
    const email = 'telemetry.candidate@minesquiz.com';
    const beaconToken = saveStudentOtp(email, 'Telemetry Candidate', '456123', 600);

    const recordResult = recordEmailBeaconOpen(beaconToken, {
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
      ip: '103.21.244.2',
      deviceType: 'Android',
      mailClient: 'Google Gmail Proxy',
    });

    expect(recordResult.success).toBe(true);
    expect(recordResult.email).toBe(email);

    // Verify OTP and check that device telemetry is attached
    const verifyResult = verifyStudentOtp(email, '456123');
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.deviceTelemetry).toBeDefined();
    expect(verifyResult.deviceTelemetry?.deviceType).toBe('Android');
    expect(verifyResult.deviceTelemetry?.mailClient).toBe('Google Gmail Proxy');
    expect(typeof verifyResult.deviceTelemetry?.openedAt).toBe('string');
  });

  test('Guarantees strict zero em-dash compliance per Senior Developer Protocol', () => {
    const files = [
      'apps/web/src/lib/emailValidation.ts',
      'apps/web/src/lib/studentAuthStore.ts',
      'apps/web/src/app/api/auth/email-beacon/route.ts',
    ];
    files.forEach((f) => {
      const fullPath = path.resolve(__dirname, '../../../../', f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toContain('\u2014');
      expect(content).not.toContain('\u2013');
    });
  });
});
