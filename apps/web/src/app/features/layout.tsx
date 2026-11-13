import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Anti-Cheat CBT Features & Examination Engine',
  description:
    'Explore MinesQuiz anti-cheat capabilities: Fisher-Yates question randomization, zero-knowledge browser delivery, MediaPipe facial tracking, and real-time strike warnings.',
  alternates: {
    canonical: 'https://minesquiz.com/features',
  },
  openGraph: {
    title: 'Anti-Cheat CBT Features & Examination Engine | MinesQuiz',
    description:
      'Explore MinesQuiz anti-cheat capabilities: Fisher-Yates question randomization, zero-knowledge browser delivery, MediaPipe facial tracking, and real-time strike warnings.',
    url: 'https://minesquiz.com/features',
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
