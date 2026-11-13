import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MinesQuiz: AI-Proctored Mining Statutory Examination Platform',
    short_name: 'MinesQuiz',
    description:
      'Premier assessment platform simulating DGMS Coal Mines Regulations (CMR 2017) statutory examinations with biometric AI proctoring.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090D16',
    theme_color: '#090D16',
    icons: [
      {
        src: '/images/minesquiz-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/minesquiz-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
