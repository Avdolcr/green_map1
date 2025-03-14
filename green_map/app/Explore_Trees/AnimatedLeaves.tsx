'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaLeaf } from 'react-icons/fa';
import { GiOakLeaf, GiMapleLeaf, GiFallingLeaf, GiLindenLeaf } from 'react-icons/gi';

// Array of different leaf components for variety
const leafTypes = [
  <FaLeaf key="leaf1" />,
  <GiOakLeaf key="leaf2" />,
  <GiMapleLeaf key="leaf3" />,
  <GiFallingLeaf key="leaf4" />,
  <GiLindenLeaf key="leaf5" />
];

// Generate a random color in the green spectrum
const getRandomGreenColor = () => {
  const h = 90 + Math.floor(Math.random() * 60); // Hue between 90-150 (yellows to greens)
  const s = 60 + Math.floor(Math.random() * 30); // Saturation between 60-90%
  const l = 30 + Math.floor(Math.random() * 30); // Lightness between 30-60%
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function AnimatedLeaves() {
  const [isClient, setIsClient] = useState(false);
  const [leaves, setLeaves] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    setIsClient(true);
    
    // Create leaves with random properties
    const newLeaves = Array.from({ length: 15 }).map((_, i) => {
      const leafType = leafTypes[Math.floor(Math.random() * leafTypes.length)];
      const size = 16 + Math.floor(Math.random() * 20); // Random size between 16-36px
      const rotationStart = Math.floor(Math.random() * 360);
      const rotationEnd = rotationStart + 180 + Math.floor(Math.random() * 180);
      const delay = Math.floor(Math.random() * 15);
      const duration = 15 + Math.floor(Math.random() * 25);
      const horizontalDrift = -20 + Math.floor(Math.random() * 40); // Random drift between -20 and 20
      
      return React.cloneElement(leafType, {
        style: {
          position: 'absolute',
          left: `${Math.floor(Math.random() * 100)}%`,
          top: '-50px',
          fontSize: `${size}px`,
          color: getRandomGreenColor(),
          opacity: 0.7 + Math.random() * 0.3,
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
          animation: `floatLeaf ${duration}s linear ${delay}s infinite`,
          '--drift': `${horizontalDrift}px`,
          '--rotation-start': `${rotationStart}deg`,
          '--rotation-end': `${rotationEnd}deg`,
        } as React.CSSProperties,
        key: `leaf-${i}`
      });
    });
    
    setLeaves(newLeaves);
  }, []);

  // Only render in the client, never on the server
  if (!isClient) return null;

  return (
    <motion.div 
      className="animated-leaves"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {leaves}
    </motion.div>
  );
} 