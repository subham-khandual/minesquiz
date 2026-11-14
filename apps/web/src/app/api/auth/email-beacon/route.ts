import { NextRequest, NextResponse } from 'next/server';
import { recordEmailBeaconOpen, DeviceTelemetry } from '../../../../lib/studentAuthStore';
import { getClientIp } from '../../../../lib/rateLimit';

// 1x1 transparent GIF binary buffer
const TRANSPARENT_BEACON_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

function parseDeviceFromUserAgent(userAgent: string): DeviceTelemetry['deviceType'] {
  const ua = userAgent.toLowerCase();
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('mobile')) return 'Mobile';
  return 'Desktop';
}

function parseMailClient(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('googleimageproxy')) return 'Google Gmail Proxy';
  if (ua.includes('applewebkit') && ua.includes('mobile')) return 'Apple Mail / iOS';
  if (ua.includes('thunderbird')) return 'Mozilla Thunderbird';
  if (ua.includes('outlook')) return 'Microsoft Outlook';
  if (ua.includes('chrome')) return 'Web Browser (Chrome)';
  if (ua.includes('firefox')) return 'Web Browser (Firefox)';
  if (ua.includes('safari')) return 'Web Browser (Safari)';
  return 'Email Client Application';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token) {
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const ip = getClientIp(request);
      const deviceType = parseDeviceFromUserAgent(userAgent);
      const mailClient = parseMailClient(userAgent);

      recordEmailBeaconOpen(token, {
        userAgent,
        ip,
        deviceType,
        mailClient,
      });

      console.log(`[Email Beacon] OTP email opened on device: ${deviceType} via ${mailClient} from IP: ${ip}`);
    }

    return new NextResponse(TRANSPARENT_BEACON_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    return new NextResponse(TRANSPARENT_BEACON_GIF, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}
