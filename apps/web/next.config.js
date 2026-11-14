/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mines-quiz/types', '@mines-quiz/utils', '@mines-quiz/ui', 'gsap', 'lenis'],
  reactStrictMode: false, // Prevents double-mounting GSAP/Lenis in dev on refresh
  poweredByHeader: false,
  typescript: {
    // Prevent CI/CD build crashes caused by DefinitelyTyped version mismatches between monorepo packages
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
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
