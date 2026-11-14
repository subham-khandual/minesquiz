import React from 'react';

interface JsonLdProps {
  faqItems?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
  includeHowTo?: boolean;
}

export const JsonLd: React.FC<JsonLdProps> = ({ faqItems, breadcrumbs, includeHowTo = true }) => {
  const websiteUrl = 'https://minesquiz.com';

  // 1. WebApplication Schema
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MinesQuiz',
    url: websiteUrl,
    description:
      'AI-Proctored statutory mining examination and CBT practice platform for DGMS Coal Mines Regulations (CMR 2017) certifications.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web, Android, iOS, Windows, macOS',
    browserRequirements: 'Requires modern web browser with WebRTC and WebAssembly support',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Person',
      name: 'Subham Khandual',
      url: 'https://github.com/subham-khandual',
      sameAs: [
        'https://github.com/subham-khandual',
        'https://www.linkedin.com/in/subham-khandual',
        'https://www.instagram.com/mr_subham7.0',
        'https://www.facebook.com/profile.php?id=100057584082708',
      ],
    },
    featureList: [
      'Statutory DGMS CMR 2017 Question Bank',
      'Zero Negative Marking Assessment Engine',
      'MediaPipe 468-Point Facial Landmark Gaze Tracking',
      'Fisher-Yates Question Randomization and Shuffling',
      'Ambient Noise and Audio Integrity Detection',
      'Multi-Device Responsive CBT Testing Suite',
      'Instant Scorecard and Performance Analytics',
    ],
  };

  // 2. EducationalOrganization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'MinesQuiz',
    url: websiteUrl,
    logo: `${websiteUrl}/images/minesquiz-logo.png`,
    description:
      'Premier assessment platform simulating Directorate General of Mines Safety (DGMS) statutory examinations for mining engineers, managers, and sirdars.',
    founder: {
      '@type': 'Person',
      name: 'Subham Khandual',
      url: 'https://github.com/subham-khandual',
      sameAs: [
        'https://github.com/subham-khandual',
        'https://www.linkedin.com/in/subham-khandual',
        'https://www.instagram.com/mr_subham7.0',
        'https://www.facebook.com/profile.php?id=100057584082708',
      ],
    },
  };

  // 3. Person Schema (E-E-A-T Credibility)
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Subham Khandual',
    jobTitle: 'Founder and Lead Software Architect',
    worksFor: {
      '@type': 'Organization',
      name: 'MinesQuiz',
    },
    url: 'https://github.com/subham-khandual',
    sameAs: [
      'https://github.com/subham-khandual',
      'https://www.linkedin.com/in/subham-khandual',
      'https://www.instagram.com/mr_subham7.0',
      'https://www.facebook.com/profile.php?id=100057584082708',
    ],
  };

  // 4. Default High-Intent FAQs (Answer Engine Optimization)
  const defaultFaqs = [
    {
      question: 'What is MinesQuiz?',
      answer:
        'MinesQuiz is an advanced AI-proctored online examination platform designed for mining engineering students and statutory candidates preparing for Directorate General of Mines Safety (DGMS) examinations under Coal Mines Regulations 2017.',
    },
    {
      question: 'Is there negative marking in MinesQuiz examinations?',
      answer:
        'No. MinesQuiz implements zero negative marking. Candidates receive +1.0 mark for each correct answer with 0 penalty for wrong or unattempted questions, allowing fearless conceptual practice.',
    },
    {
      question: 'What passing percentage is required for DGMS statutory benchmark?',
      answer:
        'A minimum statutory benchmark of 60.0% is required to pass MinesQuiz examinations (at least 18 correct answers out of 30 questions).',
    },
    {
      question: 'How does MinesQuiz AI proctoring detect exam cheating?',
      answer:
        'MinesQuiz utilizes local browser-based MediaPipe facial mesh analysis to monitor candidate head rotation, gaze deviations exceeding 35 degrees, browser tab switches, fullscreen exits, and ambient background noise.',
    },
    {
      question: 'What subjects are covered in MinesQuiz?',
      answer:
        'MinesQuiz covers core statutory mining engineering papers including MIN-101 (Mining Legislation and Safety), MIN-102 (Mine Ventilation and Gas Detection), MIN-103 (Winning and Working Methods), MIN-104 (Opencast Mining), MIN-105 (Explosives and Blasting), and MIN-106 (Mine Fires and Rescue).',
    },
  ];

  const activeFaqs = faqItems && faqItems.length > 0 ? faqItems : defaultFaqs;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: activeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // 5. BreadcrumbList Schema (Hierarchical Breadcrumb Navigation)
  const activeBreadcrumbs = breadcrumbs && breadcrumbs.length > 0
    ? breadcrumbs
    : [
        { name: 'Home', url: websiteUrl },
        { name: 'Features', url: `${websiteUrl}/features` },
        { name: 'AI Proctoring', url: `${websiteUrl}/ai-proctoring` },
        { name: 'How It Works', url: `${websiteUrl}/how-it-works` },
        { name: 'Trust and Security', url: `${websiteUrl}/trust-and-security` },
      ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: activeBreadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  // 6. HowTo Schema (Answer Engine Optimization for "How to take a DGMS mock exam on MinesQuiz")
  const howToSchema = includeHowTo
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'How to Take an AI-Proctored DGMS Statutory Exam on MinesQuiz',
        description:
          'Step-by-step candidate guide to complete a statutory mining examination with automated proctoring on MinesQuiz.',
        totalTime: 'PT60M',
        estimatedCost: {
          '@type': 'MonetaryAmount',
          currency: 'INR',
          value: '0',
        },
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Register and Verify Email with OTP',
            text: 'Sign up with your candidate email address and verify your identity using the 6-digit OTP code dispatched to your inbox.',
            url: `${websiteUrl}/#register`,
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Select Your Mining Statutory Subject',
            text: 'Choose from CMR 2017 Legislation, Mine Ventilation, Strata Control, Opencast Mining, or the Grand Full DGMS Mock.',
            url: `${websiteUrl}/candidate`,
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Review Statutory Exam Guidelines and Instructions',
            text: 'Carefully read the 5 guidelines and 5 restrictions including webcam visibility, zero window switching, and the 60-minute time limit.',
            url: `${websiteUrl}/candidate`,
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Complete Questions in Fullscreen Mode',
            text: 'Answer 30 statutory multiple-choice questions within 60 minutes with auto-saving protection active every 10 seconds.',
            url: `${websiteUrl}/candidate`,
          },
          {
            '@type': 'HowToStep',
            position: 5,
            name: 'Submit and Review Instant Scorecard',
            text: 'Submit your exam paper to receive an immediate statutory passing certificate, question breakdown, and answer key explanations.',
            url: `${websiteUrl}/results`,
          },
        ],
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
    </>
  );
};
