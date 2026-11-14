import React from 'react';
import { ExamRoom } from '../../../features/exam/ExamRoom';

export function generateStaticParams() {
  const subjects = ['all', '101', '102', '103', '104', '105', '106'];
  const modes = ['mock', 'live'];
  const params: { id: string }[] = [];
  for (const s of subjects) {
    for (const m of modes) {
      params.push({ id: `quiz-min-${s}-${m}` });
    }
  }
  params.push({ id: 'active' });
  params.push({ id: 'latest' });
  return params;
}

export default function ExamPage() {
  return <ExamRoom />;
}
