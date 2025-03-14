"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import { FaMapMarkedAlt, FaTree, FaImages, FaInfoCircle, FaHome, FaSignInAlt, FaUserPlus, FaUser, FaSignOutAlt } from 'react-icons/fa';
import Image from 'next/image';
import LogoutButton from '../../components/LogoutButton';

// Interface for user
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_picture?: string;
}

// Dynamically import the DarkModeToggle with SSR disabled
const DynamicDarkModeToggle = dynamic(
  () => import('../../components/DarkModeToggle'),
  { ssr: false }
);

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  
  // User state with refs to prevent unnecessary re-renders
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const lastAuthCheckRef = useRef(Date.now());
  const authCheckInProgressRef = useRef(false);
  const stableUserRef = useRef<User | null>(null);
  
  // Use a useState to track if dark mode is enabled to avoid the initial server/client mismatch
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Try to use the theme context, but handle the case when it's not available yet
  useEffect(() => {
    try {
      // Import the useTheme dynamically to avoid server-side rendering issues
      import("../../components/ThemeProvider").then(({ useTheme }) => {
        const { theme } = useTheme();
        setIsDarkMode(theme === 'dark');
      }).catch(err => {
        console.log("Unable to load theme provider:", err);
      });
    } catch (error) {
      console.log("Theme provider not available:", error);
    }
  }, []);

  // Improved user data fetching function
  const fetchUser = async (forceFetch = false) => {
    // Prevent multiple simultaneous auth checks unless force fetching
    if (authCheckInProgressRef.current && !forceFetch) return;
    
    authCheckInProgressRef.current = true;
    
    try {
      // Add cache-busting timestamp and avoid caching
      const response = await fetch('/api/auth/me?t=' + Date.now(), {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Only update if we have new data and it's different - use ID for comparison
        if (data.user) {
          if (!stableUserRef.current || stableUserRef.current.id !== data.user.id) {
            console.log('User data updated:', data.user.name);
            stableUserRef.current = data.user;
            setUser(data.user);
          }
        } else if (stableUserRef.current) {
          console.log('User data cleared (logged out)');
          stableUserRef.current = null;
          setUser(null);
        }
      } else {
        if (stableUserRef.current) {
          console.log('Auth check failed, clearing user data');
          stableUserRef.current = null;
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      if (stableUserRef.current) {
        stableUserRef.current = null;
        setUser(null);
      }
    } finally {
      setLoading(false);
      authCheckInProgressRef.current = false;
      lastAuthCheckRef.current = Date.now();
    }
  };

  // Force a refresh of user data
  const forceRefreshUserData = () => {
    console.log('Forcing refresh of user data');
    fetchUser(true);
  };

  // Fetch user data with improved refresh handling
  useEffect(() => {
    let isActive = true;
    let quickCheckInterval: NodeJS.Timeout | null = null;
    let slowCheckInterval: NodeJS.Timeout | null = null;
    let switchToSlowerTimeout: NodeJS.Timeout | null = null;
    
    // Run initial fetch
    fetchUser();
    
    // Add event listeners for auth changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-state-change') {
        console.log('Auth state change detected via storage event');
        lastAuthCheckRef.current = Date.now();
        forceRefreshUserData();
      }
    };
    
    // Direct auth-state-change event handler
    const handleAuthStateChange = () => {
      console.log('Auth state change event detected');
      lastAuthCheckRef.current = Date.now();
      forceRefreshUserData();
    };
    
    // Check for visibility changes to refresh auth when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // If it's been more than 5 seconds since our last check
        if (Date.now() - lastAuthCheckRef.current > 5000) {
          console.log('Page became visible, refreshing auth state');
          fetchUser();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('auth-state-change', handleAuthStateChange);
    
    // Set up special login event listener 
    const handleLoginSuccess = () => {
      console.log('Login success event detected');
      forceRefreshUserData();
    };
    window.addEventListener('login-success', handleLoginSuccess);
    
    // Check for auth changes frequently but only for a short time after page load
    quickCheckInterval = setInterval(() => fetchUser(), 2000); // Every 2 seconds initially
    
    // After 10 seconds, switch to a less frequent interval
    switchToSlowerTimeout = setTimeout(() => {
      if (quickCheckInterval) {
        clearInterval(quickCheckInterval);
        quickCheckInterval = null;
      }
      
      // Setup a longer interval for ongoing checks
      slowCheckInterval = setInterval(() => fetchUser(), 30000); // Every 30 seconds
    }, 10000);

    return () => {
      isActive = false;
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('auth-state-change', handleAuthStateChange);
      window.removeEventListener('login-success', handleLoginSuccess);
      
      if (quickCheckInterval) clearInterval(quickCheckInterval);
      if (slowCheckInterval) clearInterval(slowCheckInterval);
      if (switchToSlowerTimeout) clearTimeout(switchToSlowerTimeout);
    };
  }, []); // Empty dependency array

  useEffect(() => {
    const handleScroll = () => {
      // Only update if there's an actual change to prevent re-renders
      const shouldBeScrolled = window.scrollY > 20;
      if (scrolled !== shouldBeScrolled) {
        setScrolled(shouldBeScrolled);
      }
    };
    
    // Run once to determine initial scroll state
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const navLinks = [
    { path: '/', label: 'Home', icon: <FaHome className="text-lg" /> },
    { path: '/Explore_Map', label: 'Explore Map', icon: <FaMapMarkedAlt className="text-lg" /> },
    { path: '/Explore_Trees', label: 'Explore Trees', icon: <FaTree className="text-lg" /> },
    { path: '/Gallery', label: 'Gallery', icon: <FaImages className="text-lg" /> },
    { path: '/about', label: 'About Us', icon: <FaInfoCircle className="text-lg" /> }
  ];

  // User menu dropdown for authenticated users with simplified animations
  const UserMenu = ({ user, onClose }: { user: User, onClose: () => void }) => {
    const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
    const profilePicture = user?.profile_picture || defaultAvatar;
    
    return (
      <div className="absolute right-0 top-full mt-1 w-60 bg-[var(--background-card)] rounded-md shadow-lg p-2 z-50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            <Image
              src={profilePicture}
              alt={user.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-semibold text-[var(--text-primary)] truncate">{user.name}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
          </div>
        </div>
        
        <div className="mt-1">
          <Link 
            href="/profile"
            className="flex items-center w-full px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" 
            onClick={onClose}
          >
            <FaUser className="mr-2 text-[var(--primary)]" />
            My Profile
          </Link>
          
          <LogoutButton className="flex items-center w-full px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
            <div className="flex items-center w-full">
              <FaSignOutAlt className="mr-2 text-red-500" />
              Sign Out
            </div>
          </LogoutButton>
        </div>
      </div>
    );
  };

  // Auth Buttons with fixed width container and minimal animations
  const renderAuthButtons = () => {
    return (
      <div className="w-[190px] h-9 flex justify-end items-center">
        {loading ? (
          // Loading state
          <div className="w-[120px] h-8 flex justify-end gap-2">
            <div className="w-14 h-8 bg-[var(--primary)]/20 dark:bg-gray-700 animate-pulse rounded-md"></div>
            <div className="w-16 h-8 bg-[var(--primary)]/10 dark:bg-gray-800 animate-pulse rounded-md"></div>
          </div>
        ) : user ? (
          // Logged in state - user button
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-[var(--primary-light)] group-hover:border-[var(--primary)] transition-all">
                <Image
                  src={user.profile_picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <span className="text-[var(--text-primary)] font-medium hidden md:block">{user.name}</span>
            </button>
          
            {userMenuOpen && <UserMenu user={user} onClose={() => setUserMenuOpen(false)} />}
          </div>
        ) : (
          // Logged out state - login/register buttons
          <div className="flex items-center space-x-2">
            <Link 
              href="/login"
              className="flex items-center px-3 py-1 text-sm bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded transition"
            >
              <FaSignInAlt className="mr-1" /> 
              <span>Login</span>
            </Link>
            <Link
              href="/register"
              className="flex items-center px-3 py-1 text-sm border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-white rounded transition"
            >
              <FaUserPlus className="mr-1" /> 
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="fixed w-full z-[1001]">
      {/* Main navbar - simplified with consistent height */}
      <div 
        className={`w-full transition-colors duration-300 ${
          scrolled 
            ? 'shadow-lg py-2' 
            : 'py-4'
        } ${isDarkMode ? 'bg-[var(--primary-dark)]/95' : 'bg-[var(--background-card)]/95'} backdrop-blur-md`}
        style={{ height: scrolled ? '64px' : '80px' }}
      >
        <div className="container mx-auto flex items-center justify-between px-6 h-full">
          {/* Logo with simplified structure */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-lg flex items-center justify-center shadow-md">
                <FaTree className="text-white text-xl" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                <span className="font-normal text-[var(--text-primary)]">Green</span>
                <span className="ml-1" style={{ color: 'var(--primary)' }}>Map</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links - with stable width */}
          <div className="lg:flex items-center space-x-4 hidden">
            {navLinks.map(({ path, label, icon }) => (
              <div
                key={path}
                className={`relative flex-shrink-0 ${pathname === path ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}
              >
                <Link 
                  href={path}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:text-[var(--primary)] transition-colors"
                >
                  <span className="mr-1.5">{icon}</span>
                  {label}
                </Link>
                {pathname === path && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Right side container with auth and dark mode - fixed width */}
          <div className="flex items-center justify-end space-x-4">
            {/* Auth Buttons with Fixed Width Container */}
            {renderAuthButtons()}
            
            {/* Dark Mode Toggle - fixed width */}
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <Suspense fallback={<div className="w-6 h-6 rounded-full bg-gray-200/20"></div>}>
                <DynamicDarkModeToggle />
              </Suspense>
            </div>

            {/* Mobile Menu Button - with fixed width */}
            <div className="w-8 h-8 flex items-center justify-center lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-[var(--text-primary)] focus:outline-none w-6 h-6"
                aria-label="Toggle menu"
              >
                <div className="relative w-6 h-5 flex flex-col justify-between">
                  <span
                    className={`w-full h-0.5 bg-[var(--text-primary)] rounded-full transform transition-all duration-300 ${
                      isOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                  />
                  <span
                    className={`w-full h-0.5 bg-[var(--text-primary)] rounded-full transition-all duration-300 ${
                      isOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`w-full h-0.5 bg-[var(--text-primary)] rounded-full transform transition-all duration-300 ${
                      isOpen ? '-rotate-45 -translate-y-2' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu - Completely separate from the navbar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[1000]" style={{ top: scrolled ? '64px' : '80px' }}>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div 
            className={`fixed top-0 left-0 right-0 z-50 ${isDarkMode ? 'bg-[var(--background-dark)]' : 'bg-[var(--background-card)]'} shadow-lg rounded-b-xl overflow-hidden max-h-[80vh] overflow-y-auto`}
          >
            <div className="p-4">
              {/* Mobile navigation links */}
              {navLinks.map(({ path, label, icon }) => (
                <div key={path} className="my-2">
                  <Link 
                    href={path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center py-2 px-4 rounded-lg text-lg font-medium ${
                      pathname === path 
                        ? 'bg-[var(--primary)] text-white' 
                        : 'text-[var(--text-primary)] hover:bg-[var(--primary-light)]/10'
                    }`}
                  >
                    <span className="mr-2">{icon}</span>
                    {label}
                  </Link>
                </div>
              ))}
              
              {/* Auth Buttons for Mobile */}
              {user ? (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 mr-3">
                      <Image 
                        src={user.profile_picture || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                    </div>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center py-2 px-4 rounded-lg text-lg font-medium text-[var(--text-primary)] hover:bg-[var(--primary-light)]/10 mb-2"
                  >
                    <FaUser className="mr-2" />
                    My Profile
                  </Link>
                  
                  <LogoutButton
                    className="flex items-center py-2 px-4 rounded-lg text-lg font-medium text-red-600 dark:text-red-400 hover:bg-[var(--primary-light)]/10 w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <FaSignOutAlt className="mr-2" />
                    Sign Out
                  </LogoutButton>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 mt-4">
                  <Link 
                    href="/login" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center py-2 px-4 rounded-lg text-lg font-medium bg-[var(--primary)] text-white"
                  >
                    <FaSignInAlt className="mr-2" />
                    Login
                  </Link>
                  
                  <Link 
                    href="/register" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center py-2 px-4 rounded-lg text-lg font-medium text-[var(--primary-dark)] bg-white"
                  >
                    <FaUserPlus className="mr-2" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
