'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: number;
  user_id: number;
  activity_type: string;
  content_type: string;
  content_id: number;
  created_at: string;
  user_name?: string;
  profile_picture?: string;
  content_title?: string;
  content_image_url?: string;
  is_currently_liked?: boolean;
  contentDetails?: any;
}

export default function RecentActivity() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (status === 'authenticated') {
      // First check stats API to ensure likes are synchronized
      fetch('/api/user/stats')
        .then(response => {
          // After stats API call (which fixes missing likes), fetch activity
          fetchUserActivity();
        })
        .catch(error => {
          console.error('Error fetching stats:', error);
          // Fetch activity anyway even if stats API fails
          fetchUserActivity();
        });
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const fetchUserActivity = async () => {
    try {
      setLoading(true);
      
      // First, fetch user activity with detailed content information
      const activityResponse = await fetch('/api/user/activity?limit=10&details=true');
      
      if (!activityResponse.ok) {
        throw new Error(`Failed to fetch activity: ${activityResponse.status}`);
      }
      
      const activityData = await activityResponse.json();
      console.log('Recent activity data:', activityData);
      
      let activityItems = Array.isArray(activityData.activities) ? activityData.activities : [];
      
      // IMPORTANT FIX: Also fetch user likes directly to ensure we have all liked content
      const likesResponse = await fetch('/api/user/likes?details=true');
      
      if (likesResponse.ok) {
        const likesData = await likesResponse.json();
        console.log('User likes data:', likesData);
        
        // Convert likes to activity format and merge with activities
        if (Array.isArray(likesData.likes) && likesData.likes.length > 0) {
          const likeActivities = likesData.likes.map((like: any) => {
            return {
              id: `like_${like.id}`,
              user_id: like.user_id,
              activity_type: 'like',
              content_type: like.content_type,
              content_id: like.content_id,
              created_at: like.created_at,
              user_name: like.user_name,
              profile_picture: like.profile_picture,
              content_title: like.gallery_title || like.tree_name,
              content_image_url: like.image_url,
              is_currently_liked: true,
              // Add any other missing properties
              contentDetails: {
                title: like.gallery_title || like.tree_name,
                image_url: like.image_url,
                description: like.gallery_description || like.tree_description,
                creator: like.creator_name
              }
            };
          });
          
          // Add to our activities array, avoiding duplicates
          const existingContentIds = new Set(activityItems.map((a: ActivityItem) => `${a.content_type}_${a.content_id}`));
          
          likeActivities.forEach((likeActivity: any) => {
            const key = `${likeActivity.content_type}_${likeActivity.content_id}`;
            if (!existingContentIds.has(key)) {
              activityItems.push(likeActivity);
              existingContentIds.add(key);
            }
          });
          
          // Sort by date (newest first)
          activityItems.sort((a: ActivityItem, b: ActivityItem) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      }
      
      setActivities(activityItems);
      setError(null);
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter activities based on active tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'all') return true;
    if (activeTab === 'likes') return activity.activity_type === 'like';
    if (activeTab === 'uploads') return activity.activity_type === 'upload';
    if (activeTab === 'feedback') return activity.activity_type === 'feedback' || activity.content_type === 'feedback';
    return true;
  });

  // Get activity icon
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.activity_type) {
      case 'view':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'like':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'upload':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
        );
      case 'feedback':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  // Get activity text
  const getActivityText = (activity: ActivityItem) => {
    const contentType = activity.content_type === 'gallery' ? 'photo' : 
                      activity.content_type === 'tree' ? 'tree' : 
                      activity.content_type === 'feedback' ? 'feedback' : 'content';
    
    switch (activity.activity_type) {
      case 'view':
        return `Viewed a ${contentType}`;
      case 'like':
        return `Liked a ${contentType}`;
      case 'upload':
        return `Uploaded a ${contentType}`;
      case 'feedback':
        return `Submitted feedback`;
      default:
        return `Interacted with a ${contentType}`;
    }
  };
  
  // Get content title or description
  const getContentDetails = (activity: ActivityItem) => {
    // Check if we have content_title from the JOIN in the API
    if (activity.content_title) {
      return activity.content_title;
    }
    
    // Check if we have content details from the API
    if (activity.contentDetails) {
      if (activity.content_type === 'gallery') {
        return activity.contentDetails.title || 'Untitled photo';
      } else if (activity.content_type === 'tree') {
        return activity.contentDetails.name || activity.contentDetails.scientific_name || 'Unnamed tree';
      } else if (activity.content_type === 'feedback') {
        return activity.contentDetails.subject || 'Feedback';
      }
    }
    
    // Default fallbacks based on content type
    return activity.content_type === 'gallery' ? 'Photo' : 
           activity.content_type === 'tree' ? 'Tree' : 
           activity.content_type === 'feedback' ? 'Feedback' : 'Content';
  };
  
  // Get link to content
  const getContentLink = (activity: ActivityItem) => {
    if (activity.content_type === 'gallery') {
      return `/Gallery?view=${activity.content_id}`;
    } else if (activity.content_type === 'tree') {
      return `/Explore_Map?tree=${activity.content_id}`;
    } else if (activity.content_type === 'feedback') {
      return `/feedback`;
    }
    return '#';
  };
  
  // Get content image
  const getContentImage = (activity: ActivityItem) => {
    // Check if we have content_image_url from the JOIN in the API
    if (activity.content_image_url) {
      return activity.content_image_url;
    }
    
    // Check if we have content details from the API
    if (activity.contentDetails && activity.contentDetails.image_url) {
      return activity.contentDetails.image_url;
    }
    
    // Default fallbacks based on content type
    if (activity.content_type === 'gallery') {
      return '/placeholder-image.jpg';
    } else if (activity.content_type === 'tree') {
      return '/placeholder-tree.jpg';
    }
    
    return '/placeholder.jpg';
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-4 bg-[var(--background-card)] rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-4 bg-[var(--background-card)] rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-6">
          <p className="text-[var(--text-secondary)] mb-4">Please sign in to view your activity.</p>
          <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[var(--background-card)] rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Activity</h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeTab === 'all' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('likes')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeTab === 'likes' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Likes
          </button>
          <button 
            onClick={() => setActiveTab('uploads')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeTab === 'uploads' 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Uploads
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-6">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={fetchUserActivity}
            className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-10">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-300 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          <p className="text-[var(--text-secondary)] mb-6">
            {activeTab === 'all' 
              ? "You haven't liked any content yet." 
              : activeTab === 'likes' 
                ? "You haven't liked any content yet."
                : activeTab === 'uploads'
                  ? "You haven't uploaded any photos yet."
                  : "No activity found."
            }
          </p>
          <Link 
            href="/Gallery" 
            className="inline-block px-6 py-2 bg-emerald-100 text-emerald-800 rounded-full hover:bg-emerald-200 transition-colors text-sm font-medium shadow-sm"
          >
            Explore the Gallery
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <motion.div 
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {getActivityIcon(activity)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {getActivityText(activity)}
                    </p>
                    {getContentDetails(activity) && (
                      <p className="text-sm text-[var(--text-secondary)] truncate">
                        "{getContentDetails(activity)}"
                      </p>
                    )}
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                
                  {/* Show image thumbnail if available */}
                  <div className="ml-3 w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={getContentImage(activity)}
                      alt={getContentDetails(activity)}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                </div>
                
                <Link 
                  href={getContentLink(activity)}
                  className="text-xs text-emerald-600 hover:text-emerald-500 mt-1 inline-block"
                >
                  View {activity.content_type}
                </Link>
              </div>
            </motion.div>
          ))}
          
          {filteredActivities.length > 0 && (
            <div className="text-center pt-2">
              <Link 
                href="/profile"
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                View all activity →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 