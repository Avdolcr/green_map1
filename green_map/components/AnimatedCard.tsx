"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface AnimatedCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  linkHref?: string;
  link?: string;
  linkText?: string;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

const AnimatedCard = ({
  title,
  description,
  icon,
  imageSrc,
  imageAlt = "Card image",
  linkHref,
  link,
  linkText = "Learn more",
  className = "",
  onClick,
  delay = 0,
}: AnimatedCardProps) => {
  const href = linkHref || link;
  
  const CardWrapper = ({ children }: { children: ReactNode }) => {
    if (href) {
      return (
        <Link href={href} className="block">
          {children}
        </Link>
      );
    }
    if (onClick) {
      return <div onClick={onClick}>{children}</div>;
    }
    return <>{children}</>;
  };

  return (
    <CardWrapper>
      <motion.div
        className={`relative overflow-hidden rounded-xl bg-[var(--background-card)] shadow-md transition-all ${className}`}
        whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)" }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay }}
      >
        {/* Card background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--primary-dark)]/10 z-0" />

        {/* Card image if provided */}
        {imageSrc && (
          <div className="relative h-48 w-full overflow-hidden">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="h-full w-full"
            >
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </motion.div>
          </div>
        )}

        {/* Card content */}
        <div className="p-6 relative z-10">
          {/* Icon or circular decoration */}
          {icon && (
            <motion.div
              className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--primary-light)]/10 text-[var(--primary)]"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              {icon}
            </motion.div>
          )}

          {/* Card title with animated underline */}
          <div className="relative inline-block mb-3">
            <motion.h3 
              className="text-xl font-bold text-[var(--text-primary)]"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              {title}
            </motion.h3>
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] bg-[var(--primary-light)]"
              initial={{ width: 0 }}
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Card description */}
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
          
          {/* Animated button or action indicator */}
          {(href || onClick) && (
            <motion.div 
              className="mt-6 flex items-center text-[var(--primary)] text-sm font-medium"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.2 }}
            >
              <span>{linkText}</span>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </motion.svg>
            </motion.div>
          )}
        </div>

        {/* Decorative corner accent */}
        <motion.div
          className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[var(--secondary-light)]/20 to-transparent rounded-bl-full"
          whileHover={{ scale: 1.2, rotate: 10 }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </CardWrapper>
  );
};

export default AnimatedCard; 