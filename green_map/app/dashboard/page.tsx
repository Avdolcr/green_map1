'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { FaLeaf, FaTree, FaImage, FaMapMarkedAlt, FaPaperPlane, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';
import RecentActivity from '../components/RecentActivity';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState({
    contributionsCount: 0,
    likesCount: 0,
    uploadCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserStats();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics
      const response = await fetch('/api/user/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }
      
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center p-12 bg-[var(--background-card)] rounded-xl shadow-sm">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Welcome to Green Map</h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              Please sign in to access your dashboard and track your contributions.
            </p>
            <Link 
              href="/login?redirect=/dashboard"
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-[var(--background)]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
            <p className="text-[var(--text-secondary)]">
              Welcome back, {session?.user?.name || 'User'}!
            </p>
          </div>
          
          <Link 
            href="/profile"
            className="mt-4 md:mt-0 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full flex items-center hover:bg-emerald-200 transition-colors"
          >
            <FaUser className="mr-2" />
            View Profile
          </Link>
        </motion.div>
        
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-[var(--background-card)] rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <FaLeaf className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Contributions</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{userStats.contributionsCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background-card)] rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-red-600 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Likes Given</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{userStats.likesCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[var(--background-card)] rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <FaImage className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Uploaded Photos</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{userStats.uploadCount}</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Quick Actions */}
        <motion.div 
          className="bg-[var(--background-card)] rounded-xl shadow-sm p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/Gallery" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-center">
              <FaImage className="mx-auto text-blue-500 text-2xl mb-2" />
              <p className="font-medium">Gallery</p>
            </Link>
            
            <Link href="/Explore_Map" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-center">
              <FaMapMarkedAlt className="mx-auto text-green-500 text-2xl mb-2" />
              <p className="font-medium">Explore Map</p>
            </Link>
            
            <Link href="/feedback" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-center">
              <FaPaperPlane className="mx-auto text-purple-500 text-2xl mb-2" />
              <p className="font-medium">Send Feedback</p>
            </Link>
            
            <Link href="/trees" className="p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-center">
              <FaTree className="mx-auto text-emerald-500 text-2xl mb-2" />
              <p className="font-medium">Trees</p>
            </Link>
          </div>
        </motion.div>
        
        {/* Recent Activity Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <RecentActivity />
        </motion.div>
      </div>
    </div>
  );
} 