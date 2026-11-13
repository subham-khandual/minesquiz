'use client';

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Code2, ClipboardCheck, FileText, ArrowRight, Download, ExternalLink } from 'lucide-react';

export const V4Resources: React.FC = () => {
  const resources = [
    {
      icon: BookOpen,
      title: 'CMR 2017 Statutory Syllabus',
      tag: 'DGMS Regulation',
      color: 'from-blue-600 to-indigo-600',
      description:
        'Official Coal Mines Regulations 2017 statutory curriculum covering Mine Ventilation, Dangerous Gases (CH4, CO, CO2), Winding Regulations, and Blasting Standards.',
      linkText: 'Explore Syllabus Guide',
      href: '#features',
    },
    {
      icon: Code2,
      title: 'System Design Prompt Kit',
      tag: '21 Phases (LLD & HLD)',
      color: 'from-purple-600 to-indigo-600',
      description:
        'Master prompt kit embedded in docs/SYSTEM_DESIGN_AI_KIT.md to systematically explore any codebase from request tracing to failure recovery and scaling.',
      linkText: 'View Prompt Kit',
      href: '/docs/SYSTEM_DESIGN_AI_KIT.md',
    },
    {
      icon: ClipboardCheck,
      title: 'Candidate Exam Readiness Checklist',
      tag: 'Pre-Exam Protocol',
      color: 'from-emerald-600 to-teal-600',
      description:
        'Essential device prerequisites before starting: Webcam positioning, lighting instructions, fullscreen sandbox permissions, and noise threshold criteria.',
      linkText: 'Review Checklist',
      href: '#how-it-works',
    },
    {
      icon: FileText,
      title: 'Statutory Mock Question Bank',
      tag: '20+ Questions Active',
      color: 'from-amber-600 to-orange-600',
      description:
        'Curated question bank with randomized statutory questions and shuffled option ordering for Overman, Sirdar, and Mining Manager mock sessions.',
      linkText: 'Start Mock Exam',
      href: '#exam-launch-section',
    },
  ];

  return (
    <section
      id="resources"
      className="py-24 bg-[#F0F7FF] border-b border-blue-100 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-poppins text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-[#1E1B4B]"
          >
            Candidate & Engineering{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Resources
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-inter text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Official statutory CMR guidelines, AI system design exploration kits, candidate exam readiness checklists, and sample practice papers.
          </motion.p>
        </div>

        {/* 4 Resources Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {resources.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-blue-100 shadow-xl shadow-blue-500/5 hover:border-blue-300 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md shadow-blue-500/10`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-poppins text-xl font-bold text-[#1E1B4B] group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="font-inter text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={item.href}
                    className="font-inter text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{item.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>

                  <span className="text-[11px] text-slate-400 font-medium">Free Access</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
