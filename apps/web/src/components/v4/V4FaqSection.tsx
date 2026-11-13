'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface V4FaqSectionProps {
  title?: string;
  subtitle?: string;
  faqs?: FaqItem[];
}

export const V4FaqSection: React.FC<V4FaqSectionProps> = ({
  title = 'Frequently Asked Questions',
  subtitle = 'Find clear answers to common questions about proctoring, hardware requirements, and anti-cheat policies.',
  faqs: customFaqs,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const defaultFaqs: FaqItem[] = [
    {
      question: 'How does MinesQuiz ensure a 100% fair and cheat-proof examination?',
      answer:
        'MinesQuiz combines real-time WebRTC facial geometry tracking, head pose analysis, acoustic room frequency scanning, and strict full-screen browser lockdown. Any attempt to switch tabs, paste text, or receive external audio assistance is instantly flagged.',
    },
    {
      question: 'Is camera and microphone access mandatory for trainees and students?',
      answer:
        'Yes. Continuous video and audio streams are required to verify the candidate identity, check for second persons in the room, and ensure no unauthorized assistance occurs during the assessment.',
    },
    {
      question: 'What happens if a student switches tabs or minimizes the browser?',
      answer:
        'The candidate receives an immediate on-screen violation warning strike. If the maximum allowed strikes (configured by the institution, typically 3) are exhausted, the exam is automatically locked and submitted.',
    },
    {
      question: 'How is the single-attempt policy strictly enforced?',
      answer:
        'Every candidate email and ID is cryptographically mapped to the quiz room. Once an exam session has begun or completed, the system prevents duplicate logins or re-attempts across all browsers and devices.',
    },
    {
      question: 'Does MinesQuiz support mobile devices and low-bandwidth internet?',
      answer:
        'Yes. The WebRTC pipeline dynamically optimizes bitrate down to 150 kbps, ensuring that candidates in remote areas with unstable connections never lose exam progress or question state.',
    },
    {
      question: 'How quickly are final results and proctoring audit reports generated?',
      answer:
        'Instantaneously upon submission. Both students and examiners receive a comprehensive breakdown including objective marks, timestamped violation screenshots, and overall integrity reliability ratings.',
    },
  ];

  const faqsToDisplay = customFaqs && customFaqs.length > 0 ? customFaqs : defaultFaqs;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faqs"
      className="py-24 bg-[#F0F7FF] border-b border-blue-100 transition-colors"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center space-y-4 mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-poppins text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight text-[#1E1B4B]"
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-inter text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4 font-inter">
          {faqsToDisplay.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-white border-blue-300 shadow-md shadow-indigo-500/10'
                    : 'bg-white/90 border-blue-200/60 hover:bg-white hover:border-blue-300'
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full py-5 px-7 text-left flex items-center justify-between gap-5 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-poppins text-base sm:text-lg font-bold text-[#1E1B4B]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isOpen
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-7 pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-blue-50 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
