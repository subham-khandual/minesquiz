// Global in-memory cache for candidate registration OTPs
// Preserves state across Next.js API route invocations

export interface StudentOtpEntry {
  email: string;
  fullName: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

const globalForStudentAuth = globalThis as unknown as {
  studentOtpCache: Map<string, StudentOtpEntry> | undefined;
};

const studentOtpCache = globalForStudentAuth.studentOtpCache ?? new Map<string, StudentOtpEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForStudentAuth.studentOtpCache = studentOtpCache;
}

/**
 * Save candidate registration OTP with TTL (default: 600 seconds = 10 minutes)
 */
export function saveStudentOtp(
  email: string,
  fullName: string,
  otp: string,
  ttlSeconds: number = 600
): void {
  const normalizedEmail = email.trim().toLowerCase();
  studentOtpCache.set(normalizedEmail, {
    email: normalizedEmail,
    fullName: fullName.trim(),
    otp: otp.trim(),
    expiresAt: Date.now() + ttlSeconds * 1000,
    attempts: 0,
    verified: false,
  });
}

/**
 * Verify candidate OTP with brute-force lockout (max 8 attempts) and expiry check
 */
export function verifyStudentOtp(
  email: string,
  otp: string
): { success: boolean; error?: string; fullName?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = studentOtpCache.get(normalizedEmail);

  if (!entry) {
    return {
      success: false,
      error: 'No active OTP verification request found. Please request a new code.',
    };
  }

  // Check TTL expiry
  if (Date.now() > entry.expiresAt) {
    studentOtpCache.delete(normalizedEmail);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new 6-digit code.',
    };
  }

  // Check brute-force attempts (up to 8 attempts allowed for campus / fat-finger tolerance)
  if (entry.attempts >= 8) {
    studentOtpCache.delete(normalizedEmail);
    return {
      success: false,
      error: 'Too many incorrect attempts. This verification code has been revoked for security.',
    };
  }

  // Increment attempts counter
  entry.attempts += 1;

  if (entry.otp !== otp.trim()) {
    const remaining = 8 - entry.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark verified and delete OTP
  entry.verified = true;
  const verifiedFullName = entry.fullName;
  studentOtpCache.delete(normalizedEmail);

  return {
    success: true,
    fullName: verifiedFullName,
  };
}

/**
 * Clear candidate OTP entry
 */
export function clearStudentOtp(email: string): void {
  studentOtpCache.delete(email.trim().toLowerCase());
}
