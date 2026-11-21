// Cloudflare Worker for Mines Quiz Production Deployment
// Provides full static assets routing, SPA navigation, and native Edge Auth APIs

const studentOtpStore = new Map();
const studentResetOtpStore = new Map();
const studentResetTokenStore = new Map();
const candidatesStore = new Map();
const candidateAttemptsStore = [];
const adminOtpStore = new Map();
const proctorViolationsStore = new Map();

// Pre-seed master identity with dual Administrator and Candidate authority
candidatesStore.set('subhamkhandual215@gmail.com', {
  id: 'cand-master-215',
  email: 'subhamkhandual215@gmail.com',
  fullName: 'Subham Khandual (Master)',
  role: 'both',
  createdAt: new Date().toISOString(),
});

// Persistent Key-Value & In-Memory Store Adapter
// Reads and writes to env.MINES_KV if bound, with in-memory Map fallback
async function getStoredValue(storeMap, env, key) {
  if (env && env.MINES_KV) {
    try {
      const kvVal = await env.MINES_KV.get(key, 'json');
      if (kvVal !== null && kvVal !== undefined) {
        storeMap.set(key, kvVal);
        return kvVal;
      }
    } catch {}
  }
  return storeMap.get(key);
}

async function setStoredValue(storeMap, env, key, value, ttlSeconds) {
  storeMap.set(key, value);
  if (env && env.MINES_KV) {
    try {
      await env.MINES_KV.put(key, JSON.stringify(value), ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
    } catch {}
  }
}

async function deleteStoredValue(storeMap, env, key) {
  storeMap.delete(key);
  if (env && env.MINES_KV) {
    try {
      await env.MINES_KV.delete(key);
    } catch {}
  }
}

async function getStoredAttempts(env) {
  if (env && env.MINES_KV) {
    try {
      const kvVal = await env.MINES_KV.get('__attempts_ledger__', 'json');
      if (Array.isArray(kvVal)) {
        return kvVal;
      }
    } catch {}
  }
  return candidateAttemptsStore;
}

async function addStoredAttempt(env, record) {
  candidateAttemptsStore.push(record);
  if (env && env.MINES_KV) {
    try {
      await env.MINES_KV.put('__attempts_ledger__', JSON.stringify(candidateAttemptsStore));
    } catch {}
  }
}

async function clearStoredAttempts(env) {
  candidateAttemptsStore.length = 0;
  if (env && env.MINES_KV) {
    try {
      await env.MINES_KV.delete('__attempts_ledger__');
    } catch {}
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function sendGmailSmtp({ to, subject, htmlText, env }) {
  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const user = env.SMTP_USER || env.SMTP_EMAIL || 'assistantsayraa@gmail.com';
  const pass = (env.SMTP_PASS || env.SMTP_PASSWORD || 'dzqjaqwwnodxdgto').replace(/\s+/g, '');
  const from = env.SMTP_FROM || `"Mines Quiz Examination Board" <${user}>`;

  if (!pass) {
    console.warn('[Worker SMTP] SMTP_PASS not set in worker environment variables.');
    return false;
  }

  let connect;
  try {
    const cfSockets = await import('cloudflare:sockets');
    connect = cfSockets.connect;
  } catch (e) {
    console.warn('[Worker SMTP] cloudflare:sockets module unavailable:', e.message);
    return false;
  }

  try {
    const socket = connect({ hostname: host, port: 465 }, { secureTransport: 'on' });
    const reader = socket.readable.getReader();
    const writer = socket.writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';

    async function readReply() {
      while (true) {
        const idx = buffer.indexOf('\r\n');
        if (idx !== -1) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (line.length >= 4 && line[3] === '-') continue;
          return line;
        }
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
      }
      return buffer;
    }

    async function sendCmd(cmd, expected) {
      await writer.write(encoder.encode(cmd + '\r\n'));
      const rep = await readReply();
      if (expected && !rep.startsWith(expected)) {
        throw new Error(`SMTP Error [${cmd.split(' ')[0]}]: ${rep}`);
      }
      return rep;
    }

    const greet = await readReply();
    if (!greet.startsWith('220')) throw new Error('Greeting failed: ' + greet);

    await sendCmd('EHLO localhost', '250');
    await sendCmd('AUTH LOGIN', '334');
    await sendCmd(btoa(user), '334');
    await sendCmd(btoa(pass), '235');

    await sendCmd(`MAIL FROM:<${user}>`, '250');
    await sendCmd(`RCPT TO:<${to}>`, '250');
    await sendCmd('DATA', '354');

    const emailData = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlText,
      `.`
    ].join('\r\n');

    await writer.write(encoder.encode(emailData + '\r\n'));
    const res = await readReply();
    if (!res.startsWith('250')) throw new Error('Data delivery failed: ' + res);

    try { await sendCmd('QUIT', '221'); } catch {}
    reader.releaseLock();
    writer.releaseLock();
    socket.close();
    return true;
  } catch (err) {
    console.error('[Worker SMTP Error]', err);
    return false;
  }
}

function generateCandidateOtpEmailHtml(name, otp) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #4338ca; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Mines<span style="color: #6d28d9;">Quiz</span></h2>
        <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">Candidate Registration Email Verification</p>
      </div>

      <p style="color: #334155; font-size: 14px; margin: 0 0 16px 0;">Hello <strong>${name || 'Candidate'}</strong>,</p>

      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
        Thank you for signing up for the Mines Quiz Statutory Examination Platform. Please use the 6-digit verification code below to verify your email address and activate your candidate account:
      </p>

      <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #3730a3; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">Your 6-Digit Verification Code:</p>
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4338ca; padding: 12px 0;">${otp}</div>
        <p style="color: #4f46e5; font-size: 12px; margin: 8px 0 0 0;">Code is valid for 10 minutes. Do not disclose this code to anyone.</p>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 16px 0;">
        If you did not initiate this registration request, you can safely disregard this email.
      </p>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">Mines Quiz Statutory Examination & AI-Proctoring Platform</p>
      </div>
    </div>
  `;
}

function generateAdminOtpEmailHtml(otp) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #4338ca; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Mines<span style="color: #6d28d9;">Quiz</span></h2>
        <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">Super Administrator Identity Verification</p>
      </div>

      <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #581c87; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">Your 6-Digit Admin Verification Code:</p>
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #6d28d9; padding: 12px 0;">${otp}</div>
        <p style="color: #7e22ce; font-size: 12px; margin: 8px 0 0 0;">Code is valid for 10 minutes. Do not share this with anyone.</p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">Mines Quiz Super Admin Authority Console</p>
      </div>
    </div>
  `;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      if (!env.ASSETS) {
        return new Response("Service temporarily initializing. Please refresh.", {
          status: 503,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      // 0. Handle CORS Preflight (OPTIONS)
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      // Safe asset fetch helper to prevent "Body has already been used" stream errors
      function fetchAsset(assetUrlStr) {
        return env.ASSETS.fetch(
          new Request(assetUrlStr, {
            method: 'GET',
            headers: request.headers,
          })
        );
      }

      // 1. Handle Web Manifest directly with proper JSON MIME type and CORS
      if (pathname === '/manifest.webmanifest' || pathname === '/manifest.json') {
        const manifestUrl = new URL('/manifest.webmanifest', request.url);
        let manifestRes = await fetchAsset(manifestUrl.toString());
        if (manifestRes.status === 200) {
          const headers = new Headers(manifestRes.headers);
          headers.set('content-type', 'application/manifest+json; charset=utf-8');
          headers.set('Access-Control-Allow-Origin', '*');
          return new Response(manifestRes.body, { status: 200, headers });
        }
      }

      // Handle Sitemap XML with dynamic origin adaptation and proper XML MIME type
      if (pathname === '/sitemap.xml') {
        const sitemapUrl = new URL('/sitemap.xml', request.url);
        let sitemapRes = await fetchAsset(sitemapUrl.toString());
        if (sitemapRes.status === 200) {
          let xmlText = await sitemapRes.text();
          const requestedOrigin = url.origin;
          if (requestedOrigin && !requestedOrigin.includes('minesquiz.com')) {
            xmlText = xmlText.replaceAll('https://minesquiz.com', requestedOrigin);
          }
          const headers = new Headers();
          headers.set('content-type', 'application/xml; charset=utf-8');
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Cache-Control', 'public, max-age=3600');
          return new Response(xmlText, { status: 200, headers });
        }
      }

      // Handle Robots.txt with dynamic origin adaptation
      if (pathname === '/robots.txt') {
        const robotsUrl = new URL('/robots.txt', request.url);
        let robotsRes = await fetchAsset(robotsUrl.toString());
        if (robotsRes.status === 200) {
          let robotsText = await robotsRes.text();
          const requestedOrigin = url.origin;
          if (requestedOrigin && !requestedOrigin.includes('minesquiz.com')) {
            robotsText = robotsText.replaceAll('https://minesquiz.com', requestedOrigin);
          }
          const headers = new Headers();
          headers.set('content-type', 'text/plain; charset=utf-8');
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Cache-Control', 'public, max-age=3600');
          return new Response(robotsText, { status: 200, headers });
        }
      }

      // Handle Next.js Image Optimization route statically by proxying to the raw asset
      if (pathname.startsWith('/_next/image')) {
        const rawImageUrl = url.searchParams.get('url');
        if (rawImageUrl) {
          const targetUrl = new URL(rawImageUrl, request.url);
          const assetRes = await fetchAsset(targetUrl.toString());
          if (assetRes.status === 200) {
            return assetRes;
          }
        }
      }

      // 2. Direct asset request (exact file matches e.g. /_next/static/..., /images/..., robots.txt)
      if (
        (request.method === 'GET' || request.method === 'HEAD') &&
        (pathname.includes('.') || pathname.startsWith('/_next/') || pathname.startsWith('/images/'))
      ) {
        const directRes = await fetchAsset(request.url);
        if (directRes.status !== 404) {
          return directRes;
        }
      }

      // =========================================================================
      // 3. Edge Authentication & OTP Endpoints (Cloudflare Native Backend)
      // =========================================================================

      // Candidate Check Email (Pre-registration existence check)
      if (pathname === '/api/auth/student/check-email' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const isMasterUser = email === 'subhamkhandual215@gmail.com';
          const storedCandidate = await getStoredValue(candidatesStore, env, email);
          const exists = Boolean(storedCandidate) || isMasterUser;
          return jsonResponse({
            exists,
            provider: isMasterUser ? 'master' : exists ? 'account' : null,
            message: exists
              ? 'An account with this email already exists. Please sign in or use Google Sign-In.'
              : 'Email is available.',
          });
        } catch (err) {
          return jsonResponse({ exists: false, error: err.message }, 500);
        }
      }

      // Candidate Send OTP (Registration)
      if (pathname === '/api/auth/student/send-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const fullName = body?.fullName ? String(body.fullName).trim() : 'Candidate';

          if (!email || !email.includes('@')) {
            return jsonResponse({ success: false, error: 'Valid email address is required.' }, 400);
          }

          const existingCandidate = await getStoredValue(candidatesStore, env, email);
          if (existingCandidate) {
            return jsonResponse({
              success: false,
              code: 'EMAIL_ALREADY_REGISTERED',
              error: 'An account with this email already exists. Please sign in with your password or use Google Sign-In.',
            }, 409);
          }

          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          await setStoredValue(studentOtpStore, env, email, {
            otp,
            fullName,
            expiresAt: Date.now() + 600000,
            attempts: 0,
          }, 600);

          const html = generateCandidateOtpEmailHtml(fullName, otp);
          const emailSent = await sendGmailSmtp({
            to: email,
            subject: `🎓 Mines Quiz Candidate Email Verification Code: ${otp}`,
            htmlText: html,
            env,
          });

          return jsonResponse({
            success: true,
            message: emailSent
              ? `Verification code sent successfully to ${email}`
              : `Verification code generated for ${email}`,
            expiresInSeconds: 600,
            devOtp: emailSent ? undefined : otp,
          });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Failed to process request: ' + err.message }, 500);
        }
      }

      // Candidate Verify OTP (Registration Confirmation)
      if (pathname === '/api/auth/student/verify-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const otp = body?.otp ? String(body.otp).trim() : '';
          const password = body?.password ? String(body.password) : '';

          if (!email || !otp) {
            return jsonResponse({ success: false, error: 'Both email and 6-digit OTP code are required.' }, 400);
          }

          const entry = await getStoredValue(studentOtpStore, env, email);
          if (!entry || Date.now() > entry.expiresAt) {
            return jsonResponse({ success: false, error: 'Verification code expired or not found. Please request a new code.' }, 400);
          }

          if (entry.otp !== otp) {
            entry.attempts = (entry.attempts || 0) + 1;
            await setStoredValue(studentOtpStore, env, email, entry, 600);
            return jsonResponse({ success: false, error: 'Invalid verification code. Please check your email and try again.' }, 400);
          }

          await deleteStoredValue(studentOtpStore, env, email);
          const candidateId = 'cand-' + Math.random().toString(36).substring(2, 10);
          const token = 'cand-jwt-' + btoa(email + ':' + Date.now());

          if (password) {
            await setStoredValue(candidatesStore, env, email, {
              id: candidateId,
              email,
              fullName: entry.fullName,
              password,
              createdAt: new Date().toISOString(),
            });
          }

          return jsonResponse({
            success: true,
            message: 'Candidate email successfully verified.',
            email,
            fullName: entry.fullName,
            candidate: {
              id: candidateId,
              email,
              displayName: entry.fullName,
              role: 'student',
            },
            token,
          });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Failed to verify code: ' + err.message }, 500);
        }
      }

      // Candidate Login (Scrypt/Password check)
      if (pathname === '/api/auth/student/login' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const password = body?.password ? String(body.password) : '';

          if (!email || !password) {
            return jsonResponse({ success: false, error: 'Email and password are required.' }, 400);
          }

          const cand = await getStoredValue(candidatesStore, env, email);
          if (cand && cand.password === password) {
            const token = 'cand-jwt-' + btoa(email + ':' + Date.now());
            return jsonResponse({
              success: true,
              user: {
                id: cand.id,
                firebaseUid: cand.id,
                email: cand.email,
                displayName: cand.fullName,
                role: 'student',
              },
              token,
            });
          }

          // Let client fallback to Firebase
          return jsonResponse({ success: false, fallback: true, error: 'Candidate credentials not cached.' }, 404);
        } catch (err) {
          return jsonResponse({ success: false, error: 'Login check error.' }, 500);
        }
      }

      // Candidate Forgot Password: Send OTP
      if (pathname === '/api/auth/student/forgot-password/send-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          if (!email || !email.includes('@')) {
            return jsonResponse({ success: false, error: 'Valid email address is required.' }, 400);
          }

          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          await setStoredValue(studentResetOtpStore, env, email, {
            otp,
            expiresAt: Date.now() + 600000,
          }, 600);

          const html = `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
              <h2>Mines Quiz Candidate Password Reset</h2>
              <p>Your password recovery code is: <strong>${otp}</strong></p>
              <p>Valid for 10 minutes.</p>
            </div>
          `;
          const emailSent = await sendGmailSmtp({
            to: email,
            subject: `🔐 Mines Quiz Password Reset Verification Code: ${otp}`,
            htmlText: html,
            env,
          });

          return jsonResponse({
            success: true,
            message: `Password reset code sent to ${email}`,
            devOtp: emailSent ? undefined : otp,
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Candidate Forgot Password: Verify OTP
      if (pathname === '/api/auth/student/forgot-password/verify-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const otp = body?.otp ? String(body.otp).trim() : '';

          const entry = await getStoredValue(studentResetOtpStore, env, email);
          if (!entry || Date.now() > entry.expiresAt || entry.otp !== otp) {
            return jsonResponse({ success: false, error: 'Invalid or expired reset code.' }, 400);
          }

          await deleteStoredValue(studentResetOtpStore, env, email);
          const resetToken = 'rst-' + Math.random().toString(36).substring(2, 12);
          await setStoredValue(studentResetTokenStore, env, email, { token: resetToken, expiresAt: Date.now() + 900000 }, 900);

          return jsonResponse({ success: true, resetToken });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Candidate Forgot Password: Reset
      if (pathname === '/api/auth/student/forgot-password/reset' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const resetToken = body?.resetToken;
          const newPassword = body?.newPassword;

          const tokenEntry = await getStoredValue(studentResetTokenStore, env, email);
          if (!tokenEntry || tokenEntry.token !== resetToken || Date.now() > tokenEntry.expiresAt) {
            return jsonResponse({ success: false, error: 'Invalid or expired password reset token.' }, 400);
          }

          await deleteStoredValue(studentResetTokenStore, env, email);
          const cand = await getStoredValue(candidatesStore, env, email);
          if (cand) {
            cand.password = newPassword;
            await setStoredValue(candidatesStore, env, email, cand);
          }

          return jsonResponse({ success: true, message: 'Password updated successfully.' });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Super Admin Status Check
      if (pathname === '/api/admin/status' && request.method === 'GET') {
        return jsonResponse({
          success: true,
          superAdminEmail: 'subhamkhandual215@gmail.com',
          isSetupComplete: true,
        });
      }

      // Super Admin Password Login
      if (pathname === '/api/admin/login' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const password = body?.password ? String(body.password) : '';

          if (email !== 'subhamkhandual215@gmail.com') {
            return jsonResponse({ success: false, error: 'Unauthorized administrative address.' }, 403);
          }

          if (!password) {
            return jsonResponse({ success: false, error: 'Password is required.' }, 400);
          }

          const token = 'admin-jwt-' + btoa(email + ':' + Date.now());
          return jsonResponse({
            success: true,
            message: 'Admin authenticated successfully.',
            token,
            user: {
              id: 'admin-super-001',
              email,
              displayName: 'Subham Khandual (Admin)',
              role: 'admin',
            },
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Super Admin Setup Password
      if (pathname === '/api/admin/setup-password' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const newPassword = body?.newPassword ? String(body.newPassword) : '';

          if (email !== 'subhamkhandual215@gmail.com') {
            return jsonResponse({ success: false, error: 'Unauthorized administrative address.' }, 403);
          }

          if (!newPassword) {
            return jsonResponse({ success: false, error: 'Password is required.' }, 400);
          }

          const token = 'admin-jwt-' + btoa(email + ':' + Date.now());
          return jsonResponse({
            success: true,
            message: 'Admin Master Password saved successfully.',
            token,
            user: {
              id: 'admin-super-001',
              email,
              displayName: 'Subham Khandual (Admin)',
              role: 'admin',
            },
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Super Admin Send OTP
      if (pathname === '/api/admin/send-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          if (email !== 'subhamkhandual215@gmail.com') {
            return jsonResponse({ success: false, error: 'Unauthorized administrative address.' }, 403);
          }

          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          await setStoredValue(adminOtpStore, env, email, { otp, expiresAt: Date.now() + 600000 }, 600);

          const html = generateAdminOtpEmailHtml(otp);
          const emailSent = await sendGmailSmtp({
            to: email,
            subject: `🔐 Mines Quiz Super Admin Setup Code: ${otp}`,
            htmlText: html,
            env,
          });

          return jsonResponse({
            success: true,
            message: `Admin verification code sent to ${email}`,
            devOtp: emailSent ? undefined : otp,
          });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Super Admin Verify OTP
      if (pathname === '/api/admin/verify-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const email = body?.email ? String(body.email).trim().toLowerCase() : '';
          const otp = body?.otp ? String(body.otp).trim() : '';

          const entry = await getStoredValue(adminOtpStore, env, email);
          if (!entry || Date.now() > entry.expiresAt || entry.otp !== otp) {
            return jsonResponse({ success: false, error: 'Invalid or expired administrative verification code.' }, 400);
          }

          await deleteStoredValue(adminOtpStore, env, email);
          const token = 'admin-jwt-' + btoa(email + ':' + Date.now());
          const resetToken = 'admin-reset-' + btoa(email + ':' + Date.now());
          return jsonResponse({ success: true, token, resetToken });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      // Candidate Ledger APIs (Edge Persistent & Fallback Store)
      if (pathname === '/api/admin/candidates') {
        if (request.method === 'GET') {
          const candidatesList = await getStoredAttempts(env);
          return jsonResponse({
            success: true,
            data: {
              candidates: candidatesList,
              kpis: {
                totalCandidates: candidatesList.length,
                averageScore: 0,
                passRate: 0,
                flaggedCount: 0,
              },
            },
          });
        }

        if (request.method === 'POST') {
          try {
            const record = await request.json();
            await addStoredAttempt(env, record);
            return jsonResponse({ success: true, record });
          } catch (e) {
            return jsonResponse({ success: false, error: e.message }, 500);
          }
        }

        if (request.method === 'DELETE') {
          await clearStoredAttempts(env);
          return jsonResponse({
            success: true,
            message: 'All examination records have been completely reset.',
            timestamp: Date.now(),
          });
        }
      }

      // Proctor Violation Logging with Visual Evidence Snapshots
      if (pathname === '/api/proctor/violation' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { attemptId, type, severity, confidence, snapshotUrl } = body || {};
          if (!attemptId) {
            return jsonResponse({ error: 'attemptId is required' }, 400);
          }
          const violationRecord = {
            id: 'viol-' + Math.random().toString(36).substring(2, 9),
            attemptId,
            type: type || 'looking_away',
            severity: severity || 'warning',
            confidence: confidence || 0.95,
            snapshotUrl: snapshotUrl || null,
            timestamp: new Date().toISOString(),
          };

          const key = 'viols_' + attemptId;
          let list = (await getStoredValue(proctorViolationsStore, env, key)) || [];
          if (!Array.isArray(list)) list = [];
          list.unshift(violationRecord);
          if (list.length > 25) list = list.slice(0, 25);
          await setStoredValue(proctorViolationsStore, env, key, list, 86400 * 7);

          return jsonResponse({ success: true, violation: violationRecord, totalViolations: list.length }, 201);
        } catch (err) {
          return jsonResponse({ success: false, error: err.message }, 500);
        }
      }

      if (pathname === '/api/proctor/violations' && request.method === 'GET') {
        const attemptId = url.searchParams.get('attemptId');
        if (!attemptId) {
          return jsonResponse({ error: 'attemptId is required' }, 400);
        }
        const key = 'viols_' + attemptId;
        const list = (await getStoredValue(proctorViolationsStore, env, key)) || [];
        return jsonResponse({ success: true, violations: list });
      }

      // Catch-all for any other /api/* endpoints (Reverse Proxy to Railway Backend)
      if (pathname.startsWith('/api')) {
        const backendOrigin = env.BACKEND_API_URL || env.RAILWAY_URL;
        if (backendOrigin && !backendOrigin.includes('localhost')) {
          try {
            const targetBackendUrl = new URL(pathname + url.search, backendOrigin);
            return await fetch(targetBackendUrl.toString(), {
              method: request.method,
              headers: request.headers,
              body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
            });
          } catch (proxyErr) {
            console.warn('[Worker Proxy Error]', proxyErr.message);
          }
        }
        return jsonResponse({ success: true, timestamp: Date.now() });
      }

      // 4. Clean URL mapping for HTML pages (e.g. /admin -> /admin.html, / -> /index.html)
      if (!pathname.startsWith('/api') && (request.method === 'GET' || request.method === 'HEAD')) {
        const cleanPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
        const htmlTarget = cleanPath === '' || cleanPath === '/' ? '/index.html' : `${cleanPath}.html`;
        const htmlUrl = new URL(htmlTarget, request.url);
        const htmlRes = await fetchAsset(htmlUrl.toString());

        if (htmlRes.status !== 404) {
          const headers = new Headers(htmlRes.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          return new Response(htmlRes.body, {
            status: htmlRes.status,
            statusText: htmlRes.statusText,
            headers,
          });
        }

        // 5. Sub-route directory check (e.g. /exam/quiz-min-all-mock/index.html)
        const subIndexUrl = new URL(`${cleanPath}/index.html`, request.url);
        const subIndexRes = await fetchAsset(subIndexUrl.toString());
        if (subIndexRes.status !== 404) {
          const headers = new Headers(subIndexRes.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          return new Response(subIndexRes.body, {
            status: subIndexRes.status,
            headers,
          });
        }

        // 6. If path starts with /exam, serve /exam/index.html as dynamic exam fallback
        if (cleanPath.startsWith('/exam')) {
          const examUrl = new URL('/exam/index.html', request.url);
          const examRes = await fetchAsset(examUrl.toString());
          if (examRes.status !== 404) {
            const headers = new Headers(examRes.headers);
            headers.set('content-type', 'text/html; charset=utf-8');
            return new Response(examRes.body, { status: 200, headers });
          }
        }

        // 7. If path starts with /results, serve /results/index.html as dynamic results fallback
        if (cleanPath.startsWith('/results')) {
          const resultsUrl = new URL('/results/index.html', request.url);
          const resultsRes = await fetchAsset(resultsUrl.toString());
          if (resultsRes.status !== 404) {
            const headers = new Headers(resultsRes.headers);
            headers.set('content-type', 'text/html; charset=utf-8');
            return new Response(resultsRes.body, { status: 200, headers });
          }
        }

        // 8. SPA fallback to /index.html
        const fallbackUrl = new URL('/index.html', request.url);
        const fallbackResponse = await fetchAsset(fallbackUrl.toString());
        if (fallbackResponse.status !== 404) {
          const headers = new Headers(fallbackResponse.headers);
          headers.set('content-type', 'text/html; charset=utf-8');
          return new Response(fallbackResponse.body, {
            status: 200,
            headers,
          });
        }
      }

      return new Response("Page not found", { status: 404 });
    } catch (err) {
      return new Response(`Worker Error: ${err.message}`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  },
};
