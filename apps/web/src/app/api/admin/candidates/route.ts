import { NextResponse } from 'next/server';
import { getClientIp, checkRateLimit } from '../../../../lib/rateLimit';

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
  status: 'passed' | 'failed';
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

    // Rate Limit: Maximum 10 candidate examination records per minute per IP
    const ipLimit = checkRateLimit(`candidate_sync_ip_${clientIp}`, 10, 60);
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

    const body = await req.json();
    if (!body || !body.email || !body.name) {
      return NextResponse.json({ success: false, error: 'Candidate name and email are required.' }, { status: 400 });
    }

    const marksObtained = Math.max(0, Number(body.marksObtained ?? 0));
    const totalMarks = Math.max(1, Number(body.totalMarks || 30));
    const percentage = Math.round((marksObtained / totalMarks) * 1000) / 10;
    const status = percentage >= 60.0 ? 'passed' : 'failed';
    const violationsCount = Array.isArray(body.violations) ? body.violations.length : Number(body.violationsCount || 0);
    const proctorStatus = violationsCount === 0 ? 'clean' : violationsCount >= 3 ? 'disqualified' : 'flagged';

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
