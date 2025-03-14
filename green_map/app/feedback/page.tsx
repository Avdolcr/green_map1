'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function FeedbackPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default to true
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check auth status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Add cache-busting timestamp
        const response = await fetch('/api/auth/me?t=' + Date.now(), {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Don't change login state on error
      }
    };
    
    checkAuth();
    
    // Also listen for auth state changes from other components
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-state-change') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login-success', checkAuth);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login-success', checkAuth);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify login again just to be safe
    if (!isLoggedIn || !user) {
      toast.error('Please sign in to submit feedback');
      router.push('/login?redirect=' + encodeURIComponent('/feedback'));
      return;
    }
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, message }),
        credentials: 'include' // Important to include credentials
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Feedback submitted successfully');
        setSubject('');
        setMessage('');
      } else {
        // If we get a 401 error, then we know the user is not logged in
        if (response.status === 401) {
          setIsLoggedIn(false);
          toast.error('Please sign in to submit feedback');
          router.push('/login?redirect=' + encodeURIComponent('/feedback'));
          return;
        }
        toast.error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('An error occurred while submitting your feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
    tap: { scale: 0.95 },
  };

  const formInputVariants = {
    focus: { 
      scale: 1.01, 
      borderColor: '#16a34a', 
      boxShadow: "0 0 0 2px rgba(22, 163, 74, 0.2)" 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500 pb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Share Your Feedback
        </motion.h1>
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-l-4 border-green-500 overflow-hidden relative"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-100 to-transparent rounded-bl-full -z-10 opacity-70"></div>
          
          <p className="mb-6 text-gray-700 text-lg leading-relaxed">
            We value your feedback! Let us know what you think about the Green Map application, 
            report any issues, or suggest improvements to help us make our platform better for everyone.
          </p>
          
          {/* Show login notice if not logged in */}
          {!isLoggedIn && (
            <motion.div 
              className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-5 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-amber-700">
                  <strong>Please note:</strong> You need to be signed in to submit feedback.{' '}
                  <a 
                    href={`/login?redirect=${encodeURIComponent('/feedback')}`}
                    className="text-green-600 font-medium underline hover:text-green-700 transition-colors"
                  >
                    Sign in here
                  </a>
                </p>
              </div>
            </motion.div>
          )}

          {/* Show welcome message if logged in */}
          {isLoggedIn && user && (
            <motion.div 
              className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-5 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center space-x-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-700">
                  <strong>Hello, {user.name}!</strong> Thanks for sharing your feedback with us.
                </p>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                Subject
              </label>
              <motion.input
                type="text"
                id="subject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 shadow-sm"
                placeholder="What's your feedback about?"
                required
                disabled={isSubmitting || !isLoggedIn}
                whileFocus="focus"
                variants={formInputVariants}
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                Message
              </label>
              <motion.textarea
                id="message"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 shadow-sm resize-none"
                placeholder="Please provide details about your feedback, suggestions, or report any issues you're experiencing..."
                required
                disabled={isSubmitting || !isLoggedIn}
                whileFocus="focus"
                variants={formInputVariants}
              />
            </div>
            
            <div>
              <motion.button
                type="submit"
                disabled={isSubmitting || !isLoggedIn}
                className={`w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 px-6 rounded-xl font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all ${
                  (isSubmitting || !isLoggedIn) ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : 'Submit Feedback'}
              </motion.button>
            </div>
          </form>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 border-l-4 border-emerald-500 relative overflow-hidden"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-full -z-10 opacity-70"></div>

          <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Other Ways to Contact Us</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            If you prefer to contact us directly, you can reach out through any of these channels:
          </p>
          <motion.ul 
            className="space-y-4 text-gray-700 ml-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, staggerChildren: 0.1 }}
          >
            <motion.li className="flex items-center space-x-3" initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <div className="bg-emerald-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Email: <a href="mailto:contact@greenmap.org" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">contact@greenmap.org</a></span>
            </motion.li>
            <motion.li className="flex items-center space-x-3" initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <div className="bg-emerald-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span>Phone: (123) 456-7890</span>
            </motion.li>
            <motion.li className="flex items-center space-x-3" initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <div className="bg-emerald-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <span>Social Media: Follow us on 
                <a href="#" className="text-emerald-600 mx-1 hover:text-emerald-700 hover:underline transition-colors">Twitter</a> or 
                <a href="#" className="text-emerald-600 mx-1 hover:text-emerald-700 hover:underline transition-colors">Facebook</a>
              </span>
            </motion.li>
          </motion.ul>
        </motion.div>
      </motion.div>
    </div>
  );
} 