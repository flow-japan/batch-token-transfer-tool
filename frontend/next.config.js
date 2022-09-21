/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeFonts: true,
  },
  i18n: {
    locales: ['en', 'zh', 'ja'],
    defaultLocale: 'en',
  }
};

module.exports = nextConfig;
