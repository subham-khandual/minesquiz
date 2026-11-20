import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { SmoothScrollProvider } from '../components/providers/SmoothScrollProvider';
import { JsonLd } from '../components/seo/JsonLd';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://minesquiz.com'),
  title: {
    default: 'MinesQuiz | AI-Proctored Mining Statutory Examination Platform',
    template: '%s | MinesQuiz',
  },
  description:
    'MinesQuiz is India\'s premier AI-proctored examination platform for DGMS Coal Mines Regulations (CMR 2017) statutory certifications, mining engineering mock tests, and tamper-proof computer-based assessments.',
  applicationName: 'MinesQuiz',
  authors: [{ name: 'Subham Khandual', url: 'https://github.com/subham-khandual' }],
  generator: 'Next.js 15',
  keywords: [
    'Mines Quiz',
    'DGMS Statutory Exam',
    'Mining Engineering Quiz',
    'CMR 2017 Examination',
    'Coal Mines Regulations',
    'AI Proctoring Platform',
    'First Class Mines Manager',
    'Second Class Mines Manager',
    'Mining Sirdar Overman Exam',
    'Mining Legislation Safety',
    'Mine Ventilation Gas Detection',
    'CBT Mining Mock Test',
    'Subham Khandual',
  ],
  creator: 'Subham Khandual',
  publisher: 'MinesQuiz Inc.',
  alternates: {
    canonical: 'https://minesquiz.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://minesquiz.com',
    siteName: 'MinesQuiz',
    title: 'MinesQuiz | AI-Proctored Mining Statutory Examination Platform',
    description:
      'Practice official DGMS CMR 2017 mining questions with real-time AI face tracking, zero negative marking, and instant statutory scorecards.',
    images: [
      {
        url: '/images/minesquiz-logo.png',
        width: 1200,
        height: 630,
        alt: 'MinesQuiz AI Examination Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MinesQuiz | AI-Proctored Mining Statutory Examination Platform',
    description:
      'DGMS CMR 2017 statutory examination simulator with biometric AI proctoring, zero negative marking, and instant analytics.',
    creator: '@subhamkhandual',
    images: ['/images/minesquiz-logo.png'],
  },
  verification: {
    google: '7E9-d-bVpbXdQmSaTmY_aHsga7RWHRioRTePXMyXSJc',
    other: {
      'msvalidate.01': '17E18115B4367FE07A8B010A81A3F102',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
      { url: '/images/minesquiz-logo.png', type: 'image/png' },
    ],
    shortcut: '/icon',
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'geo.region': 'IN-JH',
    'geo.placename': 'Dhanbad, India',
    'geo.position': '23.7957;86.4304',
    'ICBM': '23.7957, 86.4304',
    'target-audience': 'Mining Engineering Students, Statutory DGMS Candidates',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} overflow-x-hidden`} suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-950 text-slate-900 font-inter antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden w-full max-w-full"
        suppressHydrationWarning
      >
        <JsonLd />
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
