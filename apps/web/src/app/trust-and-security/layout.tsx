import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Trust, Security & Cryptographic Privacy Architecture',
  description:
    'MinesQuiz enterprise security protocols: DTLS/SRTP WebRTC encryption, zero biometric video uploads, sandboxed landmark extraction, and strict role-based access.',
  alternates: {
    canonical: 'https://minesquiz.com/trust-and-security',
  },
  openGraph: {
    title: 'Trust, Security & Cryptographic Privacy Architecture | MinesQuiz',
    description:
      'Learn about MinesQuiz zero-trust security model, client-side video processing, and encrypted scorecards.',
    url: 'https://minesquiz.com/trust-and-security',
  },
};

export default function TrustAndSecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
