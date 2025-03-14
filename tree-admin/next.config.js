/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable server actions to avoid interference with navigation
    serverActions: false,
  },
  // Transpile necessary packages
  transpilePackages: ['altcha', 'leaflet', 'react-leaflet'],
  // Disable strict mode temporarily for debugging
  reactStrictMode: false,
  // Explicitly enable client-side navigation
  output: 'standalone',
  // Improve handling of CSS files
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig; 