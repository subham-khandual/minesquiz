import { NextResponse } from 'next/server';
import { APP_CONFIG } from '../../../../config/appConfig';
import {
  canonicalizeEmail,
  getCandidateSubjectAttempt,
  getAllCandidateSubjectAttempts,
} from '../../../../lib/studentAuthStore';
import { CandidateAttemptRecord } from '../../admin/candidates/route';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const subjectCode = searchParams.get('subjectCode') || searchParams.get('subject') || 'MIN-ALL';
    const mode = searchParams.get('mode') || 'live';
    const all = searchParams.get('all') === 'true';

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Candidate email is required.' },
        { status: 400 }
      );
    }

    if (all) {
      const attempts = getAllCandidateSubjectAttempts(email);
      return NextResponse.json({
        success: true,
        email,
        canonicalEmail: canonicalizeEmail(email),
        attempts,
      });
    }

    // Practice Mock mode has unlimited attempts for candidate learning and revision
    if (mode === 'mock') {
      return NextResponse.json({
        success: true,
        canAttempt: true,
        hasAttempted: false,
        status: 'open',
        mode: 'mock',
      });
    }

    // Master developer email is exempted from single-attempt locks for continuous verification
    if (APP_CONFIG.isMasterEmail(email)) {
      return NextResponse.json({
        success: true,
        canAttempt: true,
        hasAttempted: false,
        status: 'open',
        mode: 'live',
        isMasterExemption: true,
      });
    }

    const canonicalEmail = canonicalizeEmail(email);
    const normalizedCode = subjectCode.trim().toUpperCase();

    // 1. Check persistent disk ledger (.attempts-ledger.json)
    const diskAttempt = getCandidateSubjectAttempt(canonicalEmail, normalizedCode, 'live');
    if (diskAttempt) {
      return NextResponse.json({
        success: true,
        canAttempt: false,
        hasAttempted: true,
        status: diskAttempt.status,
        attempt: {
          id: diskAttempt.id,
          subjectCode: diskAttempt.subjectCode,
          subjectName: diskAttempt.subjectName,
          marksObtained: diskAttempt.marksObtained,
          totalMarks: diskAttempt.totalMarks,
          percentage: diskAttempt.percentage,
          submittedAt: diskAttempt.submittedAt,
          status: diskAttempt.status,
        },
        reason: `Single Attempt Enforcement: You have already attempted or completed this statutory examination paper (${normalizedCode}). Under DGMS regulations, multiple retakes on the same candidate email are strictly prohibited for this subject.`,
      });
    }

    // 2. Check in-memory admin candidate ledger fallback
    const memoryAttempts: CandidateAttemptRecord[] =
      globalThis.__MINES_CANDIDATE_ATTEMPTS__ || [];
    const memoryMatch = memoryAttempts.find(
      (r) =>
        canonicalizeEmail(r.email) === canonicalEmail &&
        (r.subjectCode || '').toUpperCase() === normalizedCode &&
        r.mode === 'live'
    );

    if (memoryMatch) {
      return NextResponse.json({
        success: true,
        canAttempt: false,
        hasAttempted: true,
        status: memoryMatch.status,
        attempt: {
          id: memoryMatch.id,
          subjectCode: memoryMatch.subjectCode,
          subjectName: memoryMatch.subjectName,
          marksObtained: memoryMatch.marksObtained,
          totalMarks: memoryMatch.totalMarks,
          percentage: memoryMatch.percentage,
          submittedAt: memoryMatch.submittedAt,
          status: memoryMatch.status,
        },
        reason: `Single Attempt Enforcement: You have already attempted or completed this statutory examination paper (${normalizedCode}). Under DGMS regulations, multiple retakes on the same candidate email are strictly prohibited for this subject.`,
      });
    }

    // Candidate has not attempted this statutory subject yet: Open for examination
    return NextResponse.json({
      success: true,
      canAttempt: true,
      hasAttempted: false,
      status: 'open',
      mode: 'live',
      subjectCode: normalizedCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email;
    const subjectCode = body?.subjectCode || body?.subject || 'MIN-ALL';
    const mode = body?.mode || 'live';

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Candidate email is required.' },
        { status: 400 }
      );
    }

    if (mode === 'mock') {
      return NextResponse.json({
        success: true,
        canAttempt: true,
        hasAttempted: false,
        status: 'open',
        mode: 'mock',
      });
    }

    if (APP_CONFIG.isMasterEmail(email)) {
      return NextResponse.json({
        success: true,
        canAttempt: true,
        hasAttempted: false,
        status: 'open',
        mode: 'live',
        isMasterExemption: true,
      });
    }

    const canonicalEmail = canonicalizeEmail(email);
    const normalizedCode = String(subjectCode).trim().toUpperCase();

    const diskAttempt = getCandidateSubjectAttempt(canonicalEmail, normalizedCode, 'live');
    if (diskAttempt) {
      return NextResponse.json({
        success: true,
        canAttempt: false,
        hasAttempted: true,
        status: diskAttempt.status,
        attempt: {
          id: diskAttempt.id,
          subjectCode: diskAttempt.subjectCode,
          subjectName: diskAttempt.subjectName,
          marksObtained: diskAttempt.marksObtained,
          totalMarks: diskAttempt.totalMarks,
          percentage: diskAttempt.percentage,
          submittedAt: diskAttempt.submittedAt,
          status: diskAttempt.status,
        },
        reason: `Single Attempt Enforcement: You have already attempted or completed this statutory examination paper (${normalizedCode}). Under DGMS regulations, multiple retakes on the same candidate email are strictly prohibited for this subject.`,
      });
    }

    return NextResponse.json({
      success: true,
      canAttempt: true,
      hasAttempted: false,
      status: 'open',
      mode: 'live',
      subjectCode: normalizedCode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
