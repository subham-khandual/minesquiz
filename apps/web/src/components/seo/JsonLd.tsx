import React from 'react';

interface JsonLdProps {
  faqItems?: Array<{ question: string; answer: string }>;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const JsonLd: React.FC<JsonLdProps> = ({ faqItems, breadcrumbs }) => {
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
        'MinesQuiz covers core statutory mining engineering papers including MIN-101 (Mining Legislation and Safety), MIN-102 (Mine Ventilation and Gas Detection), MIN-103 (Winning and Working Methods), and MIN-104 (Mine Surveying).',
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

  // 5. BreadcrumbList Schema (if provided)
  const breadcrumbSchema = breadcrumbs
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: crumb.name,
          item: crumb.url,
        })),
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
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
    </>
  );
};
