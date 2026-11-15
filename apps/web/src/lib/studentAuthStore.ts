import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Global in-memory cache for candidate registration OTPs, reset tokens, and accounts
// Preserves state across Next.js API route invocations

export interface DeviceTelemetry {
  openedAt?: string;
  userAgent?: string;
  ip?: string;
  deviceType?: 'Android' | 'iPhone' | 'iPad' | 'Windows' | 'Mac' | 'Linux' | 'Mobile' | 'Desktop' | 'Unknown';
  mailClient?: string;
}

export interface StudentOtpEntry {
  email: string;
  fullName: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  beaconToken?: string;
  deviceTelemetry?: DeviceTelemetry;
}

export interface StudentResetTokenEntry {
  email: string;
  token: string;
  expiresAt: number;
}

export interface StoredCandidate {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

const globalForStudentAuth = globalThis as unknown as {
  studentOtpCache: Map<string, StudentOtpEntry> | undefined;
  studentResetOtpCache: Map<string, StudentOtpEntry> | undefined;
  studentResetTokenCache: Map<string, StudentResetTokenEntry> | undefined;
  candidatesCache: Map<string, StoredCandidate> | undefined;
};

const studentOtpCache = globalForStudentAuth.studentOtpCache ?? new Map<string, StudentOtpEntry>();
const studentResetOtpCache = globalForStudentAuth.studentResetOtpCache ?? new Map<string, StudentOtpEntry>();
const studentResetTokenCache = globalForStudentAuth.studentResetTokenCache ?? new Map<string, StudentResetTokenEntry>();
const candidatesCache = globalForStudentAuth.candidatesCache ?? new Map<string, StoredCandidate>();

if (process.env.NODE_ENV !== 'production') {
  globalForStudentAuth.studentOtpCache = studentOtpCache;
  globalForStudentAuth.studentResetOtpCache = studentResetOtpCache;
  globalForStudentAuth.studentResetTokenCache = studentResetTokenCache;
  globalForStudentAuth.candidatesCache = candidatesCache;
}

function getCandidateStorePaths(): string[] {
  const current = process.cwd();
  return Array.from(
    new Set([
      path.resolve(current, '.candidates-auth.json'),
      path.resolve(current, 'apps', 'web', '.candidates-auth.json'),
      path.resolve(current, '..', '.candidates-auth.json'),
      path.resolve(current, '..', '..', '.candidates-auth.json'),
    ])
  );
}

function loadCandidatesFromDisk(): Map<string, StoredCandidate> {
  const paths = getCandidateStorePaths();
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const cand of parsed) {
            if (cand && cand.email) {
              candidatesCache.set(cand.email.trim().toLowerCase(), cand);
            }
          }
          return candidatesCache;
        }
      }
    } catch {
      // Ignore disk load errors and proceed
    }
  }
  return candidatesCache;
}

function persistCandidatesToDisk(): void {
  const paths = getCandidateStorePaths();
  const list = Array.from(candidatesCache.values());
  for (const p of paths) {
    try {
      const dir = path.dirname(p);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8');
      }
    } catch {
      // Continue to next path
    }
  }
}

// Initial hydration from disk
loadCandidatesFromDisk();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Save candidate registration OTP with TTL (default: 600 seconds = 10 minutes)
 * Generates and returns a unique beaconToken for device open tracking.
 */
export function saveStudentOtp(
  email: string,
  fullName: string,
  otp: string,
  ttlSeconds: number = 600
): string {
  const normalizedEmail = email.trim().toLowerCase();
  const beaconToken =
    Math.random().toString(36).substring(2, 12) +
    Math.random().toString(36).substring(2, 12);

  studentOtpCache.set(normalizedEmail, {
    email: normalizedEmail,
    fullName: fullName.trim(),
    otp: otp.trim(),
    expiresAt: Date.now() + ttlSeconds * 1000,
    attempts: 0,
    verified: false,
    beaconToken,
  });

  return beaconToken;
}

/**
 * Records device open telemetry when candidate views the OTP email
 */
export function recordEmailBeaconOpen(
  beaconToken: string,
  telemetry: DeviceTelemetry
): { success: boolean; email?: string } {
  // Check registration OTP cache
  for (const [email, entry] of studentOtpCache.entries()) {
    if (entry.beaconToken === beaconToken) {
      entry.deviceTelemetry = {
        ...telemetry,
        openedAt: new Date().toISOString(),
      };
      return { success: true, email };
    }
  }

  // Check reset OTP cache
  for (const [email, entry] of studentResetOtpCache.entries()) {
    if (entry.beaconToken === beaconToken) {
      entry.deviceTelemetry = {
        ...telemetry,
        openedAt: new Date().toISOString(),
      };
      return { success: true, email };
    }
  }

  return { success: false };
}

/**
 * Retrieves the candidate OTP entry including active device telemetry
 */
export function getStudentOtpEntry(email: string): StudentOtpEntry | undefined {
  return studentOtpCache.get(email.trim().toLowerCase());
}

/**
 * Verify candidate registration OTP with brute-force lockout (max 8 attempts) and expiry check
 */
export function verifyStudentOtp(
  email: string,
  otp: string
): { success: boolean; error?: string; fullName?: string; deviceTelemetry?: DeviceTelemetry } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = studentOtpCache.get(normalizedEmail);

  if (!entry) {
    return {
      success: false,
      error: 'No active OTP verification request found. Please request a new code.',
    };
  }

  if (Date.now() > entry.expiresAt) {
    studentOtpCache.delete(normalizedEmail);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new 6-digit code.',
    };
  }

  if (entry.attempts >= 8) {
    studentOtpCache.delete(normalizedEmail);
    return {
      success: false,
      error: 'Too many incorrect attempts. This verification code has been revoked for security.',
    };
  }

  entry.attempts += 1;

  if (entry.otp !== otp.trim()) {
    const remaining = 8 - entry.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  entry.verified = true;
  const verifiedFullName = entry.fullName;
  const telemetry = entry.deviceTelemetry;
  studentOtpCache.delete(normalizedEmail);

  return {
    success: true,
    fullName: verifiedFullName,
    deviceTelemetry: telemetry,
  };
}

/**
 * Save candidate password reset OTP (10 minute TTL = 600s)
 */
export function saveStudentResetOtp(
  email: string,
  otp: string,
  ttlSeconds: number = 600
): string {
  const normalizedEmail = email.trim().toLowerCase();
  const beaconToken =
    Math.random().toString(36).substring(2, 12) +
    Math.random().toString(36).substring(2, 12);

  const existingCand = candidatesCache.get(normalizedEmail);

  studentResetOtpCache.set(normalizedEmail, {
    email: normalizedEmail,
    fullName: existingCand?.fullName || 'Candidate',
    otp: otp.trim(),
    expiresAt: Date.now() + ttlSeconds * 1000,
    attempts: 0,
    verified: false,
    beaconToken,
  });

  return beaconToken;
}

/**
 * Verify candidate password reset OTP and issue single-use resetToken
 */
export function verifyStudentResetOtp(
  email: string,
  otp: string
): { success: boolean; error?: string; resetToken?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = studentResetOtpCache.get(normalizedEmail);

  if (!entry) {
    return {
      success: false,
      error: 'No active password reset request found. Please request a new code.',
    };
  }

  if (Date.now() > entry.expiresAt) {
    studentResetOtpCache.delete(normalizedEmail);
    return {
      success: false,
      error: 'Password reset code has expired. Please request a new code.',
    };
  }

  if (entry.attempts >= 5) {
    studentResetOtpCache.delete(normalizedEmail);
    return {
      success: false,
      error: 'Too many incorrect attempts. Please request a new reset code.',
    };
  }

  entry.attempts += 1;

  if (entry.otp !== otp.trim()) {
    const remaining = 5 - entry.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  studentResetOtpCache.delete(normalizedEmail);

  // Generate cryptographic single-use resetToken (valid for 10 minutes)
  const resetToken = 'creset_' + crypto.randomBytes(24).toString('hex');
  studentResetTokenCache.set(resetToken, {
    email: normalizedEmail,
    token: resetToken,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return {
    success: true,
    resetToken,
  };
}

/**
 * Validates a single-use candidate reset token
 */
export function verifyStudentResetToken(email: string, resetToken: string): boolean {
  const entry = studentResetTokenCache.get(resetToken);
  if (!entry) return false;
  if (entry.email !== email.trim().toLowerCase()) return false;
  if (Date.now() > entry.expiresAt) {
    studentResetTokenCache.delete(resetToken);
    return false;
  }
  return true;
}

/**
 * Consumes and deletes single-use candidate reset token
 */
export function consumeStudentResetToken(email: string, resetToken: string): boolean {
  if (!verifyStudentResetToken(email, resetToken)) return false;
  studentResetTokenCache.delete(resetToken);
  return true;
}

/**
 * Save candidate account upon initial OTP-verified registration
 */
export function saveCandidateAccount(
  email: string,
  fullName: string,
  password: string
): { success: boolean; error?: string; candidate?: StoredCandidate } {
  if (!email || !password || password.length < 8) {
    return { success: false, error: 'Valid email and password (minimum 8 characters) are required.' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);

  const candidate: StoredCandidate = {
    id: 'cand_' + crypto.randomBytes(8).toString('hex'),
    email: normalizedEmail,
    fullName: fullName.trim() || 'Candidate',
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  candidatesCache.set(normalizedEmail, candidate);
  persistCandidatesToDisk();

  return { success: true, candidate };
}

/**
 * Checks if a candidate account is already registered
 */
export function hasCandidateAccount(email: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  loadCandidatesFromDisk();
  return candidatesCache.has(normalizedEmail);
}

/**
 * Verifies candidate email + password credentials for routine direct sign-in (NO OTP)
 */
export function verifyCandidateCredentials(
  email: string,
  password: string
): { success: boolean; error?: string; candidate?: StoredCandidate } {
  const normalizedEmail = email.trim().toLowerCase();
  loadCandidatesFromDisk();

  const candidate = candidatesCache.get(normalizedEmail);
  if (!candidate || !candidate.passwordHash || !candidate.passwordSalt) {
    return { success: false, error: 'Candidate account not found. Please register first.' };
  }

  const computedHash = hashPassword(password, candidate.passwordSalt);
  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(candidate.passwordHash, 'hex')
    );

    if (!isMatch) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    return { success: true, candidate };
  } catch {
    return { success: false, error: 'Authentication verification failure.' };
  }
}

/**
 * Resets candidate password after OTP verification
 */
export function updateCandidatePassword(
  email: string,
  resetToken: string,
  newPassword: string
): { success: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (!verifyStudentResetToken(normalizedEmail, resetToken)) {
    return { success: false, error: 'Reset session is invalid or expired. Please verify via OTP again.' };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must contain at least 8 characters.' };
  }

  loadCandidatesFromDisk();
  let candidate = candidatesCache.get(normalizedEmail);

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(newPassword, salt);

  if (candidate) {
    candidate.passwordHash = hash;
    candidate.passwordSalt = salt;
    candidate.updatedAt = new Date().toISOString();
  } else {
    candidate = {
      id: 'cand_' + crypto.randomBytes(8).toString('hex'),
      email: normalizedEmail,
      fullName: 'Candidate',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  candidatesCache.set(normalizedEmail, candidate);
  persistCandidatesToDisk();
  consumeStudentResetToken(normalizedEmail, resetToken);

  return { success: true };
}

/**
 * Checks whether candidate account exists in registry
 */
export function getCandidateByEmail(email: string): StoredCandidate | undefined {
  loadCandidatesFromDisk();
  return candidatesCache.get(email.trim().toLowerCase());
}

/**
 * Clear candidate OTP entry
 */
export function clearStudentOtp(email: string): void {
  studentOtpCache.delete(email.trim().toLowerCase());
}
