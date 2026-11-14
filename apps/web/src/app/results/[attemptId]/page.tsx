import React from 'react';
import ResultsClientView from './ResultsClientView';

export function generateStaticParams() {
  return [
    { attemptId: 'latest' },
    { attemptId: 'review' },
    { attemptId: 'recent' },
  ];
}

export default function ResultsPage() {
  return <ResultsClientView />;
}
