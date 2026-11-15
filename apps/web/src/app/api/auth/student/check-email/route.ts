import { NextResponse } from 'next/server';
import { hasCandidateAccount } from '../../../../../lib/studentAuthStore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ exists: false });
    }

    const isMasterUser = email === 'subhamkhandual215@gmail.com';
    const exists = hasCandidateAccount(email) || isMasterUser;

    return NextResponse.json({
      exists,
      provider: isMasterUser ? 'master' : exists ? 'account' : null,
      message: exists
        ? 'An account with this email address already exists. Please sign in or use Google Sign-In.'
        : 'Email is available.',
    });
  } catch (err: any) {
    return NextResponse.json({ exists: false, error: err?.message || 'Error checking email' }, { status: 500 });
  }
}
