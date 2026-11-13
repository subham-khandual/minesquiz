import { ImageResponse } from 'next/og';

export const alt = 'MinesQuiz: AI-Proctored Mining Statutory Examination Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #090D16 0%, #111827 50%, #1E1B4B 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '40px',
        }}
      >
        {/* Brand Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
            }}
          >
            MQ
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '56px',
              fontWeight: 900,
              letterSpacing: '-1px',
            }}
          >
            <span>Mines</span>
            <span style={{ color: '#60A5FA' }}>Quiz</span>
          </div>
        </div>

        {/* Heading */}
        <div
          style={{
            display: 'flex',
            fontSize: '32px',
            fontWeight: 700,
            color: '#F8FAFC',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.3,
            marginBottom: '24px',
          }}
        >
          AI-Proctored Mining Statutory Examination Platform
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '20px',
            color: '#94A3B8',
            textAlign: 'center',
            maxWidth: '850px',
            marginBottom: '40px',
          }}
        >
          DGMS Coal Mines Regulations (CMR 2017) • Biometric Proctoring • Zero Negative Marking
        </div>

        {/* Feature Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '10px 24px',
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '9999px',
              fontSize: '18px',
              color: '#93C5FD',
              fontWeight: 600,
            }}
          >
            DGMS Compliant
          </div>
          <div
            style={{
              display: 'flex',
              padding: '10px 24px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '9999px',
              fontSize: '18px',
              color: '#6EE7B7',
              fontWeight: 600,
            }}
          >
            Zero Negative Marking
          </div>
          <div
            style={{
              display: 'flex',
              padding: '10px 24px',
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: '9999px',
              fontSize: '18px',
              color: '#C4B5FD',
              fontWeight: 600,
            }}
          >
            AI Face Tracking
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
