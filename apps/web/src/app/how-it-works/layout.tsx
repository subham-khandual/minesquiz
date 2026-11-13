import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'How It Works | Remote Statutory CBT Examination Flow',
  description:
    'Learn how candidates verify identity, launch secure CBT assessments, undergo continuous AI proctoring, and review immediate statutory scorecards on MinesQuiz.',
  alternates: {
    canonical: 'https://minesquiz.com/how-it-works',
  },
  openGraph: {
    title: 'How It Works | Remote Statutory CBT Examination Flow | MinesQuiz',
    description:
      'Step-by-step examination walkthrough from biometric verification to instant answer key review on MinesQuiz.',
    url: 'https://minesquiz.com/how-it-works',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
