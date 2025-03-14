'use client';
import { useEffect, useState } from 'react';

export default function LeafletCSS() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Load Leaflet CSS via a dynamic stylesheet link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      
      // Check if link is already in document
      if (!document.querySelector(`link[href="${link.href}"]`)) {
        document.head.appendChild(link);
      }
      
      return () => {
        // Clean up when component unmounts
        const existingLink = document.querySelector(`link[href="${link.href}"]`);
        if (existingLink) {
          document.head.removeChild(existingLink);
        }
      };
    }
  }, []);
  
  return null;
} 