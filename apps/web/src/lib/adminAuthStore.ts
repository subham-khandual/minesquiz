import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const SUPER_ADMIN_EMAIL = 'subhamkhandual215@gmail.com';

interface StoredAdminData {
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  updatedAt?: string;
}

interface OtpEntry {
  otp: string;
  reason: 'setup' | 'forgot_password';
  expiresAt: number;
  attempts: number;
}

interface ResetTokenEntry {
  token: string;
  expiresAt: number;
}

// Global in-memory cache for fast access and dev server persistence
const globalForAdminAuth = globalThis as unknown as {
  adminOtpCache: Map<string, OtpEntry> | undefined;
  adminResetTokenCache: Map<string, ResetTokenEntry> | undefined;
  cachedAdminData: StoredAdminData | undefined;
};

const adminOtpCache = globalForAdminAuth.adminOtpCache ?? new Map<string, OtpEntry>();
const adminResetTokenCache = globalForAdminAuth.adminResetTokenCache ?? new Map<string, ResetTokenEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForAdminAuth.adminOtpCache = adminOtpCache;
  globalForAdminAuth.adminResetTokenCache = adminResetTokenCache;
}

function getCandidateFilePaths(): string[] {
  const current = process.cwd();
  const rawList = [
    path.resolve(current, '.admin-auth.json'),
    path.resolve(current, 'apps', 'web', '.admin-auth.json'),
    path.resolve(current, '..', '.admin-auth.json'),
    path.resolve(current, '..', '..', '.admin-auth.json'),
  ];
  return Array.from(new Set(rawList));
}

function loadStoredAdminData(): StoredAdminData {
  const candidates = getCandidateFilePaths();
  let firstValidData: StoredAdminData | null = null;

  // Priority 1: Find candidate with completed password configuration
  for (const fp of candidates) {
    try {
      if (fs.existsSync(fp)) {
        const raw = fs.readFileSync(fp, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (!firstValidData) {
            firstValidData = parsed;
          }
          if (parsed.passwordHash && parsed.passwordSalt) {
            globalForAdminAuth.cachedAdminData = parsed;
            // Synchronize other paths so stale files do not persist
            for (const otherFp of candidates) {
              try {
                if (otherFp !== fp && fs.existsSync(path.dirname(otherFp))) {
                  fs.writeFileSync(otherFp, JSON.stringify(parsed, null, 2), 'utf-8');
                }
              } catch {
                // ignore sync errors
              }
            }
            return parsed;
          }
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  if (firstValidData) {
    globalForAdminAuth.cachedAdminData = firstValidData;
    return firstValidData;
  }

  return globalForAdminAuth.cachedAdminData || { email: SUPER_ADMIN_EMAIL };
}

function saveStoredAdminData(data: StoredAdminData): void {
  globalForAdminAuth.cachedAdminData = data;
  const candidates = getCandidateFilePaths();
  for (const fp of candidates) {
    try {
      const dir = path.dirname(fp);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (err) {
      // ignore
    }
  }
}

/**
 * Strict identity check: only subhamkhandual215@gmail.com is authorized
 */
export function isSuperAdmin(email: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Checks whether the Super Admin has configured their master password
 */
export function isSetupComplete(): boolean {
  const data = loadStoredAdminData();
  return Boolean(data.passwordHash && data.passwordSalt);
}

/**
 * Hash password using cryptographic scrypt
 */
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Set or reset the Super Admin Master Password
 */
export function setAdminPassword(password: string): { success: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { success: false, error: 'Password must contain at least 8 characters.' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);

  const updated: StoredAdminData = {
    email: SUPER_ADMIN_EMAIL,
    passwordHash: hash,
    passwordSalt: salt,
    updatedAt: new Date().toISOString(),
  };

  saveStoredAdminData(updated);
  return { success: true };
}

/**
 * Verify input password against stored cryptographic salted hash
 */
export function verifyAdminPassword(password: string): boolean {
  const data = loadStoredAdminData();
  if (!data.passwordHash || !data.passwordSalt) {
    return false;
  }

  const computedHash = hashPassword(password, data.passwordSalt);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(data.passwordHash, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Save temporary OTP with 5-minute TTL
 */
export function saveAdminOtp(
  email: string,
  otp: string,
  reason: 'setup' | 'forgot_password' = 'setup',
  ttlSeconds = 300
): void {
  const normalized = email.trim().toLowerCase();
  adminOtpCache.set(normalized, {
    otp: otp.trim(),
    reason,
    expiresAt: Date.now() + ttlSeconds * 1000,
    attempts: 0,
  });
}

/**
 * Verify 6-digit OTP and generate single-use reset token
 */
export function verifyAdminOtp(
  email: string,
  inputOtp: string
): { valid: boolean; resetToken?: string; error?: string } {
  const normalized = email.trim().toLowerCase();
  const entry = adminOtpCache.get(normalized);

  if (!entry) {
    return { valid: false, error: 'No OTP requested or code has expired. Please request a new code.' };
  }

  if (Date.now() > entry.expiresAt) {
    adminOtpCache.delete(normalized);
    return { valid: false, error: 'OTP code has expired. Please request a new one.' };
  }

  if (entry.attempts >= 5) {
    adminOtpCache.delete(normalized);
    return { valid: false, error: 'Too many incorrect attempts. Please request a fresh OTP.' };
  }

  if (entry.otp !== inputOtp.trim()) {
    entry.attempts += 1;
    return { valid: false, error: 'Incorrect OTP code. Please check and try again.' };
  }

  // OTP verified successfully, clear OTP to prevent reuse
  adminOtpCache.delete(normalized);

  // Issue single-use reset token valid for 10 minutes (600 seconds)
  const resetToken = 'rst_' + crypto.randomBytes(24).toString('hex');
  adminResetTokenCache.set(normalized, {
    token: resetToken,
    expiresAt: Date.now() + 600 * 1000,
  });

  return { valid: true, resetToken };
}

/**
 * Validate reset token for password configuration
 */
export function verifyResetToken(email: string, token: string): boolean {
  const normalized = email.trim().toLowerCase();
  const entry = adminResetTokenCache.get(normalized);

  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    adminResetTokenCache.delete(normalized);
    return false;
  }

  return entry.token === token.trim();
}

/**
 * Consume reset token after password successfully set
 */
export function consumeResetToken(email: string, token: string): boolean {
  if (verifyResetToken(email, token)) {
    adminResetTokenCache.delete(email.trim().toLowerCase());
    return true;
  }
  return false;
}
