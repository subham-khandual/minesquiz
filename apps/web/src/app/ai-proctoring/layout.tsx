import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'AI Proctoring Architecture, Face Mesh & Gaze Tracking',
  description:
    'Discover how MinesQuiz performs client-side MediaPipe 468-point facial mesh tracking, sub-50ms gaze angle calculation, voice activity detection, and privacy protection.',
  alternates: {
    canonical: 'https://minesquiz.com/ai-proctoring',
  },
  openGraph: {
    title: 'AI Proctoring Architecture, Face Mesh & Gaze Tracking | MinesQuiz',
    description:
      'Client-side biometric proctoring with local MediaPipe facial mesh, gaze deviation alerts, and WebAssembly execution.',
    url: 'https://minesquiz.com/ai-proctoring',
  },
};

export default function AiProctoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
