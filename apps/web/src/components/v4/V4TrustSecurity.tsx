'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, KeyRound, Fingerprint, Mail, CheckCircle2 } from 'lucide-react';

export const V4TrustSecurity: React.FC = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Immutable Single Admin Whitelist',
      badge: 'Gmail SMTP Verified',
      color: 'from-purple-600 to-indigo-600',
      description:
        'Sole administrative access locked to subhamkhandual215@gmail.com. Google Gmail SMTP 2-step OTP verification required before master password creation. All unauthorized emails rejected with HTTP 403.',
    },
    {
      icon: KeyRound,
      title: 'Cryptographic Salted Hashing',
      badge: 'scrypt 64-Byte Salted',
      color: 'from-blue-600 to-indigo-600',
      description:
        'Admin master passwords hashed using Node.js crypto.scryptSync with 16-byte random cryptographic salts. Secrets are never stored in plaintext or exposed over public APIs.',
    },
    {
      icon: ShieldCheck,
      title: 'Anti-Leak Question Delivery',
      badge: 'Zero-Knowledge Client',
      color: 'from-emerald-600 to-teal-600',
      description:
        'Statutory examination questions delivered to candidate browsers strictly exclude correctOptionIds. Browser DevTools inspection cannot reveal answers before submission.',
    },
    {
      icon: Fingerprint,
      title: 'Single-Attempt Enforcement',
      badge: 'SHA-256 Identity Hash',
      color: 'from-amber-600 to-orange-600',
      description:
        'Candidate email hashes permanently lock repeated attempts. Candidates cannot re-take statutory exams to fish questions or manipulate examination averages.',
    },
  ];

  return (
    <section
      id="trust-and-security"
      className="py-24 bg-[#FAF5FF] border-b border-purple-100 transition-colors"
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
            Trust & Security{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
              Architecture
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-inter text-base sm:text-lg text-slate-600 leading-relaxed"
          >
            Statutory exam integrity protected by single-admin Gmail SMTP verification, cryptographic scrypt hashing, and zero-trust sandbox boundaries.
          </motion.p>
        </div>

        {/* 4-Card Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
          {securityFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-purple-100/80 shadow-xl shadow-purple-500/5 hover:border-purple-300 transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md shadow-purple-500/10`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-poppins text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-poppins text-xl font-bold text-[#1E1B4B] group-hover:text-purple-700 transition-colors">
                    {item.title}
                  </h3>

                  <p className="font-inter text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified & Actively Enforced</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Compliance Callout Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-6 sm:p-8 rounded-3xl bg-white border border-blue-200/80 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-poppins font-bold text-base text-[#1E1B4B]">
                Directorate General of Mines Safety (DGMS) Standards
              </h4>
              <p className="font-inter text-xs sm:text-sm text-slate-600 mt-0.5">
                Compliant with Coal Mines Regulations (CMR 2017) statutory certification exam requirements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold font-poppins px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
            <span>TLS 1.3 & AES-256 Standard</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
