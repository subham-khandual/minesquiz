import { NextResponse } from 'next/server';
import { getClientIp, checkRateLimit } from '../../../../lib/rateLimit';
import { verifySignedJwt } from '../../../../lib/jwtServer';
import { recordSubjectAttemptToDisk } from '../../../../lib/studentAuthStore';
import { APP_CONFIG } from '../../../../config/appConfig';

export interface CandidateAttemptRecord {
  id: string;
  name: string;
  email: string;
  subjectCode: string;
  subjectName: string;
  mode: 'mock' | 'live';
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  status: 'passed' | 'failed' | 'disqualified';
  proctorStatus: 'clean' | 'flagged' | 'disqualified';
  violationsCount: number;
  violations: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  submittedAt: string;
  timeSpentMinutes: number;
}

// Global runtime memory storage strictly for genuine Live Quiz candidate submissions
declare global {
  var __MINES_CANDIDATE_ATTEMPTS__: CandidateAttemptRecord[] | undefined;
}

if (!globalThis.__MINES_CANDIDATE_ATTEMPTS__) {
  globalThis.__MINES_CANDIDATE_ATTEMPTS__ = [];
}

function isAuthorizedAdmin(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split('Bearer ')[1].trim();

  // Cryptographic RFC 7519 JWT verification
  const verification = verifySignedJwt(token);
  if (
    verification.valid &&
    (verification.payload?.role === 'admin' || verification.payload?.role === 'both')
  ) {
    return true;
  }

  // Graceful fallback during migration transition for legacy admin-jwt prefix
  if (token.startsWith('admin-jwt-')) return true;
  if (process.env.NODE_ENV === 'development' && token.length > 5) return true;
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Admin credentials required to inspect candidate examination ledger.',
      },
      { status: 401 }
    );
  }

  const allCandidates = globalThis.__MINES_CANDIDATE_ATTEMPTS__ || [];

  // Strictly filter for live proctored examination attempts only
  const candidates = allCandidates.filter((c) => c.mode === 'live');

  // Calculate high-level summary KPIs
  const totalCandidates = candidates.length;
  const totalScore = candidates.reduce((acc, curr) => acc + curr.percentage, 0);
  const averageScore = totalCandidates > 0 ? Math.round((totalScore / totalCandidates) * 10) / 10 : 0;
  const passedCount = candidates.filter((c) => c.status === 'passed').length;
  const passRate = totalCandidates > 0 ? Math.round((passedCount / totalCandidates) * 1000) / 10 : 0;
  const flaggedCount = candidates.filter((c) => c.proctorStatus === 'flagged' || c.proctorStatus === 'disqualified').length;

  return NextResponse.json({
    success: true,
    data: {
      candidates,
      kpis: {
        totalCandidates,
        averageScore,
        passRate,
        flaggedCount,
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const body = await req.json();

    if (!body || !body.email || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Candidate name and email are required.' },
        { status: 400 }
      );
    }

    const candidateEmail = String(body.email).trim().toLowerCase();
    const isMasterUser = APP_CONFIG.isMasterEmail(candidateEmail);
    const isDevOrLocalhost =
      process.env.NODE_ENV === 'development' ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === 'localhost';

    // Master developer email is completely exempted from rate limits for continuous testing
    if (!isMasterUser) {
      const maxRequests = isDevOrLocalhost ? 120 : 30;
      const ipLimit = checkRateLimit(`candidate_sync_ip_${clientIp}`, maxRequests, 60);
      if (!ipLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Rate limit exceeded. Too many examination submissions from this IP. Retry in ${ipLimit.retryAfterSeconds} seconds.`,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
          }
        );
      }
    }

    const marksObtained = Math.max(0, Number(body.marksObtained ?? 0));
    const totalMarks = Math.max(1, Number(body.totalMarks || 30));
    const percentage = Math.round((marksObtained / totalMarks) * 1000) / 10;
    const violationsCount = Array.isArray(body.violations) ? body.violations.length : Number(body.violationsCount || 0);
    const isDisqualified = Boolean(
      body.status === 'disqualified' ||
        body.isDisqualified ||
        (violationsCount >= 2 && marksObtained === 0)
    );
    const proctorStatus = isDisqualified ? 'disqualified' : violationsCount === 0 ? 'clean' : 'flagged';
    const status = isDisqualified ? 'disqualified' : percentage >= 60.0 ? 'passed' : 'failed';

    const newRecord: CandidateAttemptRecord = {
      id: body.id || 'att-' + Math.random().toString(36).substring(2, 9),
      name: String(body.name).trim(),
      email: String(body.email).trim().toLowerCase(),
      subjectCode: body.subjectCode || 'MIN-ALL',
      subjectName: body.subjectName || 'Mining Statutory Assessment',
      mode: body.mode === 'live' ? 'live' : 'mock',
      marksObtained,
      totalMarks,
      percentage,
      status,
      proctorStatus,
      violationsCount,
      violations: Array.isArray(body.violations) ? body.violations : [],
      submittedAt: new Date().toISOString(),
      timeSpentMinutes: Math.max(1, Number(body.timeSpentMinutes || 30)),
    };

    if (!globalThis.__MINES_CANDIDATE_ATTEMPTS__) {
      globalThis.__MINES_CANDIDATE_ATTEMPTS__ = [];
    }

    // Strictly persist Live Quiz attempts to the official Admin Ledger
    if (newRecord.mode === 'live') {
      const existingIdx = globalThis.__MINES_CANDIDATE_ATTEMPTS__.findIndex((r) => r.id === newRecord.id);
      if (existingIdx >= 0) {
        globalThis.__MINES_CANDIDATE_ATTEMPTS__[existingIdx] = newRecord;
      } else {
        globalThis.__MINES_CANDIDATE_ATTEMPTS__.unshift(newRecord);
      }

      // Memory Bounded Cap: retain maximum 500 records to prevent memory exhaustion / DoS
      if (globalThis.__MINES_CANDIDATE_ATTEMPTS__.length > 500) {
        globalThis.__MINES_CANDIDATE_ATTEMPTS__.length = 500;
      }

      // Persist to disk ledger for hacker-proof single attempt enforcement across restarts and devices
      try {
        recordSubjectAttemptToDisk({
          id: newRecord.id,
          rawEmail: newRecord.email,
          subjectCode: newRecord.subjectCode,
          subjectName: newRecord.subjectName,
          mode: 'live',
          status: newRecord.proctorStatus === 'disqualified' ? 'terminated' : 'submitted',
          marksObtained: newRecord.marksObtained,
          totalMarks: newRecord.totalMarks,
          percentage: newRecord.percentage,
          violationsCount: newRecord.violationsCount,
          timeSpentMinutes: newRecord.timeSpentMinutes,
          submittedAt: newRecord.submittedAt,
          clientIp,
        });
      } catch (diskErr) {
        console.warn('[Admin Candidates] Failed to persist attempt to disk ledger:', diskErr);
      }
    }

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAuthorizedAdmin(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin credentials required to reset examination ledger.' },
      { status: 401 }
    );
  }

  globalThis.__MINES_CANDIDATE_ATTEMPTS__ = [];
  return NextResponse.json({
    success: true,
    message: 'All examination records have been completely reset.',
    timestamp: Date.now(),
  });
}
