// Global in-memory cache for candidate registration OTPs and Device Telemetry
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

const globalForStudentAuth = globalThis as unknown as {
  studentOtpCache: Map<string, StudentOtpEntry> | undefined;
};

const studentOtpCache = globalForStudentAuth.studentOtpCache ?? new Map<string, StudentOtpEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForStudentAuth.studentOtpCache = studentOtpCache;
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
  for (const [email, entry] of studentOtpCache.entries()) {
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
 * Verify candidate OTP with brute-force lockout (max 8 attempts) and expiry check
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

  // Mark verified and return telemetry
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
 * Clear candidate OTP entry
 */
export function clearStudentOtp(email: string): void {
  studentOtpCache.delete(email.trim().toLowerCase());
}
