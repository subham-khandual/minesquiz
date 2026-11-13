import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
          borderRadius: '38px',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '4px solid #60A5FA',
          boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
        }}
      >
        <div
          style={{
            fontSize: '84px',
            fontWeight: 900,
            letterSpacing: '-3px',
            color: '#FFFFFF',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          MQ
        </div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: '#93C5FD',
            marginTop: '8px',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          MinesQuiz
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
