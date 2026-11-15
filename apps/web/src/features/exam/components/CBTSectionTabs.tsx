'use client';

import React from 'react';

export interface SectionDefinition {
  id: 'section-a' | 'section-b' | 'section-c';
  title: string;
  shortTitle: string;
  startIndex: number;
  endIndex: number; // inclusive
}

export const STATUTORY_SECTIONS: SectionDefinition[] = [
  {
    id: 'section-a',
    title: 'General Aptitude & Mining Legislation',
    shortTitle: 'Sec A',
    startIndex: 0,
    endIndex: 9,
  },
  {
    id: 'section-b',
    title: 'Technical Knowledge (CMR 2017)',
    shortTitle: 'Sec B',
    startIndex: 10,
    endIndex: 19,
  },
  {
    id: 'section-c',
    title: 'Advanced Technical & Safety',
    shortTitle: 'Sec C',
    startIndex: 20,
    endIndex: 29,
  },
];

interface CBTSectionTabsProps {
  currentIndex: number;
  onSelectSection: (startIndex: number) => void;
}

export const CBTSectionTabs: React.FC<CBTSectionTabsProps> = ({
  currentIndex,
  onSelectSection,
}) => {
  // Determine current active section
  const currentSection = STATUTORY_SECTIONS.find(
    (sec) => currentIndex >= sec.startIndex && currentIndex <= sec.endIndex
  ) || STATUTORY_SECTIONS[0];

  return (
    <div className="w-full bg-[#0A192F]/95 lg:bg-slate-900 border-b border-slate-800 px-3 lg:px-6 py-2 select-none">
      {/* =========================================================================
          DESKTOP / LAPTOP TABS (lg:flex)
          Full titles with range tags
          ========================================================================= */}
      <div className="hidden lg:flex items-center gap-3">
        {STATUTORY_SECTIONS.map((sec, idx) => {
          const isActive = currentSection.id === sec.id;
          const letter = String.fromCharCode(65 + idx); // A, B, C

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.startIndex)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-poppins font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/40'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:text-white'
              }`}
            >
              <span>Section {letter}: {sec.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                ({sec.startIndex + 1} - {sec.endIndex + 1})
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          MOBILE VIEWPORT TABS (lg:hidden)
          Sleek compact pill buttons: Sec A (1-10), Sec B (11-20), Sec C (21-30)
          ========================================================================= */}
      <div className="flex lg:hidden items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
        {STATUTORY_SECTIONS.map((sec) => {
          const isActive = currentSection.id === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.startIndex)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-poppins font-bold transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <span>{sec.shortTitle}</span>
              <span className={`text-[10px] font-mono ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                ({sec.startIndex + 1}-{sec.endIndex + 1})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
