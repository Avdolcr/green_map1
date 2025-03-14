"use client";

import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { FaMoon, FaSun } from 'react-icons/fa';

const DarkModeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <motion.button
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05, boxShadow: isDarkMode ? '0 0 8px rgba(255, 255, 255, 0.3)' : '0 0 8px rgba(0, 0, 0, 0.2)' }}
      className="relative p-1.5 w-12 h-6 rounded-full flex items-center justify-between overflow-hidden"
      style={{
        backgroundColor: isDarkMode 
          ? 'var(--primary-dark)' 
          : 'var(--background-alt)',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: isDarkMode 
          ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
          : '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
      onClick={toggleTheme}
    >
      {/* Sun Icon */}
      <motion.div
        animate={{
          opacity: isDarkMode ? 0.4 : 1,
          scale: isDarkMode ? 0.5 : 1,
          x: isDarkMode ? -2 : 0
        }}
        transition={{ duration: 0.2 }}
        className="relative z-10 flex items-center justify-center"
      >
        <FaSun 
          className="w-3 h-3"
          style={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'var(--primary)' 
          }} 
        />
      </motion.div>

      {/* Moon Icon */}
      <motion.div
        animate={{
          opacity: isDarkMode ? 1 : 0.4,
          scale: isDarkMode ? 1 : 0.5,
          x: isDarkMode ? 0 : 2
        }}
        transition={{ duration: 0.2 }}
        className="relative z-10 flex items-center justify-center"
      >
        <FaMoon 
          className="w-3 h-3"
          style={{ 
            color: isDarkMode ? 'var(--secondary-light)' : 'rgba(0, 0, 0, 0.3)' 
          }} 
        />
      </motion.div>

      {/* Toggle Slider */}
      <motion.div
        className="absolute rounded-full w-4.5 h-4.5 bg-white shadow-md"
        style={{ 
          width: '18px', 
          height: '18px'
        }}
        animate={{
          x: isDarkMode ? 'calc(100% - 20px)' : '2px',
          backgroundColor: isDarkMode ? 'var(--secondary-light)' : 'white',
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
      >
        {/* Inner subtle gradient */}
        <div 
          className="absolute inset-0 rounded-full opacity-30"
          style={{ 
            background: isDarkMode
              ? 'radial-gradient(circle at 70% 70%, var(--secondary-light), transparent)'
              : 'radial-gradient(circle at 30% 30%, white, transparent)'
          }}
        />
      </motion.div>

      {/* Background track lighting effect */}
      <motion.div 
        className="absolute inset-0 rounded-full"
        animate={{
          background: isDarkMode
            ? 'linear-gradient(to right, var(--primary-dark), var(--primary))'
            : 'linear-gradient(to right, var(--background-alt), var(--secondary-light)/30)'
        }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
};

export default DarkModeToggle; 