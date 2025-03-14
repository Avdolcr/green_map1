"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface AnimatedButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

const AnimatedButton = ({
  children,
  href,
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  disabled = false,
  type = 'button',
  ariaLabel,
}: AnimatedButtonProps) => {
  // Base classes for all variants
  let variantClasses = '';
  let sizeClasses = '';
  
  // Variant-specific classes
  switch (variant) {
    case 'primary':
      variantClasses = 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] focus:ring-[var(--primary-light)]';
      break;
    case 'secondary':
      variantClasses = 'bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--secondary-light)] focus:ring-[var(--secondary)]';
      break;
    case 'outline':
      variantClasses = 'bg-transparent border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 focus:ring-[var(--primary)]';
      break;
    case 'ghost':
      variantClasses = 'bg-transparent text-[var(--primary)] hover:bg-[var(--primary)]/10 focus:ring-[var(--primary)]';
      break;
  }
  
  // Size-specific classes
  switch (size) {
    case 'sm':
      sizeClasses = 'text-sm px-3 py-1.5 rounded-md';
      break;
    case 'md':
      sizeClasses = 'text-base px-4 py-2 rounded-lg';
      break;
    case 'lg':
      sizeClasses = 'text-lg px-6 py-3 rounded-lg';
      break;
  }
  
  // Combine all classes
  const buttonClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${variantClasses}
    ${sizeClasses}
    ${className}
  `;
  
  // Animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.03 },
    tap: { scale: 0.98 },
  };
  
  // Icon animation variants
  const iconVariants = {
    initial: { x: 0 },
    hover: { x: iconPosition === 'right' ? 5 : -5 },
  };
  
  // Render content with proper icon placement
  const renderContent = () => (
    <>
      {icon && iconPosition === 'left' && (
        <motion.span 
          className="mr-2" 
          variants={iconVariants}
        >
          {icon}
        </motion.span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <motion.span 
          className="ml-2" 
          variants={iconVariants}
        >
          {icon}
        </motion.span>
      )}
    </>
  );
  
  // Render as link or button
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel}>
        <motion.span
          className={buttonClasses}
          variants={buttonVariants}
          initial="initial"
          whileHover={disabled ? "" : "hover"}
          whileTap={disabled ? "" : "tap"}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {renderContent()}
          <motion.span
            className="absolute bottom-0 left-0 h-0.5 bg-white w-0 group-hover:w-full"
            whileHover={{ width: '100%' }}
            transition={{ duration: 0.3 }}
          />
        </motion.span>
      </Link>
    );
  }
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
      variants={buttonVariants}
      initial="initial"
      whileHover={disabled ? "" : "hover"}
      whileTap={disabled ? "" : "tap"}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      aria-label={ariaLabel}
    >
      {renderContent()}
      <motion.span
        className="absolute bottom-0 left-0 h-0.5 bg-white/50 w-0"
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

export default AnimatedButton; 