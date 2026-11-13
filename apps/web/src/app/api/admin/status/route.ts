import { NextResponse } from 'next/server';
import { SUPER_ADMIN_EMAIL, isSetupComplete } from '../../../../lib/adminAuthStore';

export async function GET() {
  try {
    const setupDone = isSetupComplete();
    return NextResponse.json({
      success: true,
      superAdminEmail: SUPER_ADMIN_EMAIL,
      isSetupComplete: setupDone,
    });
  } catch (error: any) {
    console.error('API /api/admin/status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while checking admin status.' },
      { status: 500 }
    );
  }
}
