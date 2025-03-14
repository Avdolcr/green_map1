/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
    // Ensure middleware runs in Node.js runtime
    middleware: {
      // This ensures middleware uses Node.js runtime
      unstable_allowDynamicGlobals: true,
      unstable_excludedHeaders: ['user-agent'], // Example needed for the configuration
      waitUntil: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig; 