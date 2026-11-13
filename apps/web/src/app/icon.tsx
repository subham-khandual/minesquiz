import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
          borderRadius: '7px',
          color: 'white',
          fontSize: '17px',
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.5px',
          border: '1px solid #60A5FA',
        }}
      >
        MQ
      </div>
    ),
    {
      ...size,
    }
  );
}
