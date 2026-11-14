/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mines-quiz/types', '@mines-quiz/utils', '@mines-quiz/ui', 'gsap', 'lenis'],
  reactStrictMode: false, // Prevents double-mounting GSAP/Lenis in dev on refresh
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion/react', 'gsap'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
