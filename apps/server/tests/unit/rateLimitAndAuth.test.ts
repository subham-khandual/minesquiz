describe('Rate Limiting & Candidate OTP Security Invariants', () => {
  // Test sliding window rate limiter implementation
  function createSlidingWindowLimiter() {
    const store = new Map<string, { count: number; resetAt: number }>();
    return {
      check(key: string, maxRequests: number, windowMs: number, currentTime: number) {
        const record = store.get(key);
        if (!record || currentTime > record.resetAt) {
          store.set(key, { count: 1, resetAt: currentTime + windowMs });
          return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
        }
        if (record.count >= maxRequests) {
          const retryAfter = Math.ceil((record.resetAt - currentTime) / 1000);
          return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
        }
        record.count += 1;
        return { allowed: true, remaining: maxRequests - record.count, retryAfterSeconds: 0 };
      },
      clear() {
        store.clear();
      },
    };
  }

  // Test cooldown implementation
  function createCooldownGuard() {
    const store = new Map<string, number>();
    return {
      check(key: string, cooldownMs: number, currentTime: number) {
        const lastRequest = store.get(key);
        if (!lastRequest || currentTime - lastRequest >= cooldownMs) {
          store.set(key, currentTime);
          return { allowed: true, remainingSeconds: 0 };
        }
        const remaining = Math.ceil((cooldownMs - (currentTime - lastRequest)) / 1000);
        return { allowed: false, remainingSeconds: Math.max(1, remaining) };
      },
      clear() {
        store.clear();
      },
    };
  }

  // Test candidate OTP lifecycle
  interface OtpRecord {
    email: string;
    otp: string;
    expiresAt: number;
    attempts: number;
  }

  function createCandidateOtpStore() {
    const store = new Map<string, OtpRecord>();
    return {
      save(email: string, otp: string, ttlSeconds: number, currentTime: number) {
        store.set(email.toLowerCase(), {
          email: email.toLowerCase(),
          otp,
          expiresAt: currentTime + ttlSeconds * 1000,
          attempts: 0,
        });
      },
      verify(email: string, inputOtp: string, maxAttempts: number, currentTime: number) {
        const record = store.get(email.toLowerCase());
        if (!record) {
          return { success: false, error: 'NO_OTP_FOUND' };
        }
        if (currentTime > record.expiresAt) {
          store.delete(email.toLowerCase());
          return { success: false, error: 'OTP_EXPIRED' };
        }
        if (record.attempts >= maxAttempts) {
          store.delete(email.toLowerCase());
          return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED' };
        }
        record.attempts += 1;
        if (record.otp !== inputOtp) {
          const remaining = maxAttempts - record.attempts;
          if (remaining <= 0) {
            store.delete(email.toLowerCase());
            return { success: false, error: 'MAX_ATTEMPTS_EXCEEDED' };
          }
          return { success: false, error: 'INVALID_CODE', remainingAttempts: remaining };
        }
        store.delete(email.toLowerCase());
        return { success: true };
      },
      get(email: string) {
        return store.get(email.toLowerCase());
      },
    };
  }

  describe('Campus Network Rate Limiting (60 requests / 15 minutes)', () => {
    it('allows 60 consecutive requests for shared campus lab IP and blocks 61st', () => {
      const limiter = createSlidingWindowLimiter();
      const ip = '14.139.221.10'; // Typical National Knowledge Network / College IP
      const windowMs = 15 * 60 * 1000;
      let mockTime = 1000000;

      // First 60 requests must be allowed (accommodating lab students)
      for (let i = 1; i <= 60; i++) {
        const res = limiter.check(`ip_${ip}`, 60, windowMs, mockTime);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(60 - i);
      }

      // 61st request must be throttled
      const blocked = limiter.check(`ip_${ip}`, 60, windowMs, mockTime);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

      // After window reset, requests should be permitted again
      mockTime += windowMs + 1000;
      const afterWindow = limiter.check(`ip_${ip}`, 60, windowMs, mockTime);
      expect(afterWindow.allowed).toBe(true);
      expect(afterWindow.remaining).toBe(59);
    });
  });

  describe('Email Dispatch Cooldown (30 Seconds)', () => {
    it('enforces 30-second cooldown between OTP requests for the same email', () => {
      const cooldown = createCooldownGuard();
      const email = 'candidate@minesquiz.com';
      const cooldownMs = 30 * 1000;
      let mockTime = 5000000;

      // First request is allowed
      const first = cooldown.check(`email_${email}`, cooldownMs, mockTime);
      expect(first.allowed).toBe(true);

      // Immediate retry after 10 seconds is rejected
      mockTime += 10 * 1000;
      const earlyRetry = cooldown.check(`email_${email}`, cooldownMs, mockTime);
      expect(earlyRetry.allowed).toBe(false);
      expect(earlyRetry.remainingSeconds).toBe(20);

      // Retry after 30 seconds is allowed
      mockTime += 21 * 1000; // total 31 seconds elapsed
      const validRetry = cooldown.check(`email_${email}`, cooldownMs, mockTime);
      expect(validRetry.allowed).toBe(true);
    });
  });

  describe('Candidate OTP Lifespan & 8-Attempt Forgiving Security', () => {
    it('successfully verifies correct OTP within 10-minute TTL', () => {
      const otpStore = createCandidateOtpStore();
      const email = 'student@ismdhanbad.ac.in';
      const otp = '849201';
      let mockTime = 10000000;

      otpStore.save(email, otp, 600, mockTime); // 10 minutes = 600s
      expect(otpStore.get(email)).toBeDefined();

      // Verify after 4 minutes (well within 10-minute TTL)
      mockTime += 4 * 60 * 1000;
      const res = otpStore.verify(email, otp, 8, mockTime);
      expect(res.success).toBe(true);

      // OTP should be consumed / single-use
      expect(otpStore.get(email)).toBeUndefined();
    });

    it('rejects verification if OTP has exceeded 10-minute TTL', () => {
      const otpStore = createCandidateOtpStore();
      const email = 'student@ismdhanbad.ac.in';
      const otp = '123456';
      let mockTime = 10000000;

      otpStore.save(email, otp, 600, mockTime);

      // Advance time by 11 minutes (past 600 seconds)
      mockTime += 11 * 60 * 1000;
      const res = otpStore.verify(email, otp, 8, mockTime);
      expect(res.success).toBe(false);
      expect(res.error).toBe('OTP_EXPIRED');
    });

    it('permits up to 7 fat-finger errors and locks out on 8th invalid attempt', () => {
      const otpStore = createCandidateOtpStore();
      const email = 'student@nitrkl.ac.in';
      const correctOtp = '654321';
      let mockTime = 10000000;

      otpStore.save(email, correctOtp, 600, mockTime);

      // 7 wrong attempts must decrement remaining attempts gracefully
      for (let attempt = 1; attempt <= 7; attempt++) {
        const res = otpStore.verify(email, '000000', 8, mockTime);
        expect(res.success).toBe(false);
        expect(res.error).toBe('INVALID_CODE');
        expect(res.remainingAttempts).toBe(8 - attempt);
      }

      // 8th wrong attempt locks out and purges token
      const eighthAttempt = otpStore.verify(email, '000000', 8, mockTime);
      expect(eighthAttempt.success).toBe(false);
      expect(eighthAttempt.error).toBe('MAX_ATTEMPTS_EXCEEDED');

      // Subsequent attempt confirms OTP was purged from memory
      const purgedAttempt = otpStore.verify(email, correctOtp, 8, mockTime);
      expect(purgedAttempt.success).toBe(false);
      expect(purgedAttempt.error).toBe('NO_OTP_FOUND');
    });
  });
});
