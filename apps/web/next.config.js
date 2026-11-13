/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mines-quiz/types', '@mines-quiz/utils', '@mines-quiz/ui', 'gsap', 'lenis'],
  reactStrictMode: false, // Prevents double-mounting GSAP/Lenis in dev on refresh
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion/react', 'gsap'],
  },
};

module.exports = nextConfig;
