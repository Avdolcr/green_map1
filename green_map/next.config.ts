import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'www.gravatar.com',           // For user profile pictures
      'raw.githubusercontent.com',   // For map marker icons
      'cdnjs.cloudflare.com',       // For Leaflet map icons
      'example.com',                // For placeholder examples
      'unpkg.com',                  // For Leaflet CSS
    ],
  },
};

export default nextConfig;
