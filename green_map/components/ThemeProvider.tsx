"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

// Create context with a default value to avoid the undefined check
const defaultValue: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {}
};

const ThemeContext = createContext<ThemeContextType>(defaultValue);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Set theme to specific value
  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Effect to initialize theme from localStorage and watch for system preference
  useEffect(() => {
    // Using a try-catch to avoid issues with localStorage access
    try {
      // Check for localStorage preference
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark') {
        setTheme('dark');
      } else if (storedTheme === 'light') {
        setTheme('light');
      } else {
        // If no stored preference, check system preference
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemPreference);
      }
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      
      // Use the correct event listener method based on browser support
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // @ts-ignore - For older browsers
        mediaQuery.addListener(handleChange);
      }
      
      // Mark as mounted after initialization
      setMounted(true);
      
      // Clean up listeners
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          // @ts-ignore - For older browsers
          mediaQuery.removeListener(handleChange);
        }
      };
    } catch (error) {
      // Fallback if localStorage or window.matchMedia is not available
      console.error("Error initializing theme:", error);
      setMounted(true);
    }
  }, []);
  
  // Apply theme class to body element
  useEffect(() => {
    if (mounted) {
      try {
        // Add a class to prevent transition flicker during theme change
        document.body.classList.add('no-text-transition');
        
        if (theme === 'dark') {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('light-mode');
          localStorage.setItem('theme', 'dark');
        } else {
          document.body.classList.add('light-mode');
          document.body.classList.remove('dark-mode');
          localStorage.setItem('theme', 'light');
        }
        
        // Allow a small delay before removing the transition prevention class
        setTimeout(() => {
          document.body.classList.remove('no-text-transition');
        }, 50);
      } catch (error) {
        console.error("Error applying theme:", error);
      }
    }
  }, [theme, mounted]);

  // Value provided to context consumers
  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeValue
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
} 