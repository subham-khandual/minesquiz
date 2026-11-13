import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'DGMS Question Bank & CMR 2017 Regulatory Resources',
  description:
    'Free mining statutory question bank covering Coal Mines Regulations (CMR 2017), Mine Safety Legislation, Ventilation Standards, and First Class Manager practice sets.',
  alternates: {
    canonical: 'https://minesquiz.com/resources',
  },
  openGraph: {
    title: 'DGMS Question Bank & CMR 2017 Regulatory Resources | MinesQuiz',
    description:
      'Official DGMS statutory question repository, regulation references, and study materials for mining engineers.',
    url: 'https://minesquiz.com/resources',
  },
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
