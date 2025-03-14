'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaEdit, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaLeaf, 
  FaTree, 
  FaImages, 
  FaUpload, 
  FaUser, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaPalette,
  FaTimes
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_picture: string | null;
  bio: string | null;
  location: string | null;
  joined_date: string;
  created_at?: string;
  contributions_count: number;
  preferences?: any;
}

// Available theme colors for profiles
const THEME_COLORS = [
  { name: 'Emerald', value: 'from-emerald-500 to-emerald-400', code: '#10b981' },
  { name: 'Sky', value: 'from-sky-500 to-sky-400', code: '#0ea5e9' },
  { name: 'Violet', value: 'from-violet-500 to-violet-400', code: '#8b5cf6' },
  { name: 'Rose', value: 'from-rose-500 to-rose-400', code: '#f43f5e' },
  { name: 'Amber', value: 'from-amber-500 to-amber-400', code: '#f59e0b' },
  { name: 'Lime', value: 'from-lime-500 to-lime-400', code: '#84cc16' },
  { name: 'Indigo', value: 'from-indigo-500 to-indigo-400', code: '#6366f1' },
  { name: 'Pink', value: 'from-pink-500 to-pink-400', code: '#ec4899' },
];

// Add a debug mode flag at the top, after imports
const DEBUG_MODE = true; // Set to false for production

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  
  // Add state for user activity
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [userLikes, setUserLikes] = useState<any[]>([]);
  const [userGalleryImages, setUserGalleryImages] = useState<any[]>([]);
  const [userFeedback, setUserFeedback] = useState<any[]>([]);
  const [activityTab, setActivityTab] = useState('all');
  
  // Form data for general profile info
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    profile_picture: '',
    profile_color: ''
  });
  
  // Form data for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Add this state to track previously fetched feedback for comparison
  const [prevFeedback, setPrevFeedback] = useState<any[]>([]);

  // Add this utility function near the top of the component before useEffect hooks
  // This helps normalize data from different API formats
  const normalizeImageData = (images: any[]) => {
    if (!images || !Array.isArray(images)) return [];
    
    return images.map((img: any) => {
      // Create a normalized image object with consistent property names
      return {
        id: img.id || img.image_id || img.gallery_id || img._id || '',
        title: img.title || img.name || img.gallery_title || img.caption || 'Untitled',
        description: img.description || img.gallery_description || img.caption || img.alt || '',
        image_url: img.image_url || img.url || img.src || img.gallery_image || img.thumbnail || '/placeholder-image.jpg',
        created_at: img.created_at || img.uploaded_at || img.date || img.timestamp || new Date().toISOString(),
        user_id: img.user_id || img.userId || img.uploader_id || img.uploaded_by || '',
        user_name: img.user_name || img.userName || img.creator_name || img.author || '',
        like_count: img.like_count || img.likes || 0,
        view_count: img.view_count || img.views || 0,
      };
    });
  };

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, redirect to login
            router.push('/login?redirect=/profile');
            return;
          }
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          profile_picture: data.user.profile_picture || '',
          profile_color: data.user.preferences?.profile_color || 'from-emerald-500 to-emerald-400'
        });
        
        // Fetch user activity after successful login
        fetchUserActivity();
      } catch (err) {
        setError('Error loading profile. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleColorSelect = (color: string) => {
    setFormData(prev => ({
      ...prev,
      profile_color: color
    }));
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setUpdateError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Check file size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError('Image size should be less than 5MB');
      return;
    }
    
    setUpdateError(null);
    setUpdateLoading(true);
    setUploadProgress(0);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Fake progress updates (for UI feedback)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + (100 - prev) * 0.1;
          return next > 95 ? 95 : next;
        });
      }, 100);
      
      // Upload the file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      setUploadProgress(100);
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({
        ...prev,
        profile_picture: data.url
      }));
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      setUpdateError('Failed to upload image. Please try again.');
      console.error(err);
    } finally {
      setUpdateLoading(false);
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
      
      const data = await response.json();
      setUser(prev => prev ? { ...prev, ...data.user } : null);
      setSuccessMessage('Profile updated successfully!');
      
      // Automatically close edit mode after successful update
      setTimeout(() => {
        setSuccessMessage(null);
        setEditMode(false);
      }, 2000);
      
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating profile. Please try again.');
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };
  
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);
    setSuccessMessage(null);
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setUpdateError('New passwords do not match');
      setUpdateLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setUpdateError('New password must be at least 8 characters long');
      setUpdateLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update password');
      }
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password updated successfully!');
      
      // Automatically hide success message after a delay
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      setUpdateError(err.message || 'Error updating password. Please try again.');
      console.error(err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Fetch user activity data
  const fetchUserActivity = async () => {
    if (!user) return;
    
    setActivityLoading(true);
    try {
      // Fetch all user activity with enhanced details
      const activityResponse = await fetch('/api/user/activity?limit=20&details=true');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        console.log('Activity data:', activityData);
        setUserActivity(activityData.activities || []);
      } else {
        console.error('Failed to fetch activity:', await activityResponse.text());
      }
      
      // Fetch user likes with enhanced details
      const likesResponse = await fetch('/api/user/likes?details=true');
      if (likesResponse.ok) {
        const likesData = await likesResponse.json();
        console.log('Likes data:', likesData);
        // Normalize the likes data
        const normalizedLikes = normalizeImageData(likesData.likes || []);
        setUserLikes(normalizedLikes);
      } else {
        console.error('Failed to fetch likes:', await likesResponse.text());
      }
      
      // Fetch user's gallery uploads with better filtering
      const galleryResponse = await fetch('/api/gallery');
      if (galleryResponse.ok) {
        const galleryData = await galleryResponse.json();
        console.log('Gallery data:', galleryData);
        
        // More robust filtering for user images
        const rawUserImages = galleryData.images.filter((img: any) => {
          // Check multiple ways an image might be associated with the user
          const isUserEmail = img.user_email === user.email;
          const isUserId = img.user_id === user.id || img.userId === user.id || 
                           img.user_id === user.id?.toString() || 
                           (typeof img.user_id === 'number' && img.user_id === Number(user.id));
          const isUploader = img.uploader_id === user.id || img.uploader === user.id || 
                            img.uploaded_by === user.id || img.uploaded_by === user.email ||
                            img.user_name === user.name;
          
          return isUserEmail || isUserId || isUploader;
        });
        
        // Normalize the data structure
        const userImages = normalizeImageData(rawUserImages);
        console.log('Filtered user images:', userImages);
        setUserGalleryImages(userImages || []);
      }
      
      // Fetch user's feedback
      const feedbackResponse = await fetch('/api/feedback/user');
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setUserFeedback(feedbackData.feedback || []);
      }
      
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  // Add an effect to make sure gallery data is refreshed when switching to the uploads tab
  useEffect(() => {
    if (activityTab === 'uploads' || activityTab === 'likes') {
      // Refetch user activity data focusing on gallery and likes
      const fetchGalleryAndLikes = async () => {
        if (!user) return;
        
        try {
          if (activityTab === 'uploads') {
            // Fetch user's gallery uploads directly
            const galleryResponse = await fetch('/api/gallery');
            if (galleryResponse.ok) {
              const galleryData = await galleryResponse.json();
              // More robust filtering for user images
              const rawUserImages = galleryData.images.filter((img: any) => {
                // Check multiple ways an image might be associated with the user
                return img.user_email === user.email || 
                       img.user_id === user.id || 
                       img.uploader_id === user.id || 
                       img.uploaded_by === user.id || 
                       img.uploader === user.name;
              });
              const userImages = normalizeImageData(rawUserImages);
              setUserGalleryImages(userImages || []);
            }
          }
          
          if (activityTab === 'likes') {
            // Fetch user likes with enhanced details
            const likesResponse = await fetch('/api/user/likes?details=true');
            if (likesResponse.ok) {
              const likesData = await likesResponse.json();
              // Normalize the likes data
              const normalizedLikes = normalizeImageData(likesData.likes || []);
              setUserLikes(normalizedLikes);
            }
          }
        } catch (error) {
          console.error('Error fetching gallery or likes data:', error);
        }
      };
      
      fetchGalleryAndLikes();
    }
  }, [activityTab, user]);

  // Modify the feedback fetch effect to check for new replies
  useEffect(() => {
    if (activityTab === 'feedback') {
      // Fetch user's feedback when tab is selected
      const fetchFeedback = async () => {
        try {
          const feedbackResponse = await fetch('/api/feedback/user');
          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            const newFeedback = feedbackData.feedback || [];
            
            // Check for new replies by comparing with previous feedback
            if (prevFeedback.length > 0) {
              newFeedback.forEach((newItem: any) => {
                const oldItem = prevFeedback.find((item: any) => item.id === newItem.id);
                
                // If there's a new reply that wasn't there before
                if (oldItem && !oldItem.admin_reply && newItem.admin_reply) {
                  // Show notification to user
                  toast.success(`New reply received for your feedback: "${newItem.subject}"`, {
                    duration: 5000
                  });
                }
              });
            }
            
            // Update feedback state and save previous state
            setUserFeedback(newFeedback);
            setPrevFeedback(newFeedback);
          }
        } catch (error) {
          console.error('Error fetching feedback:', error);
        }
      };
      
      fetchFeedback();
      
      // Set up an interval to refresh feedback data every 30 seconds
      const refreshInterval = setInterval(fetchFeedback, 30000);
      
      // Clean up the interval when component unmounts or tab changes
      return () => clearInterval(refreshInterval);
    }
  }, [activityTab, prevFeedback]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Should never happen because of redirect in useEffect
  }

  const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  const profilePicture = user.profile_picture || defaultAvatar;
  
  // Get the user's profile color or use default
  const profileColorClass = formData.profile_color || 'from-emerald-500 to-emerald-400';

  return (
    <div className="min-h-screen pt-20 pb-12 bg-[var(--background)]">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-[var(--background-card)] rounded-xl shadow-md overflow-hidden mb-8">
          <div className={`relative h-48 bg-gradient-to-r ${profileColorClass}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditMode(!editMode)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-10"
            >
              <FaEdit className="text-emerald-600 text-lg" />
            </motion.button>
          </div>
          
          <div className="relative px-6 py-5 flex flex-col md:flex-row items-center">
            <div className="relative -mt-24 mb-4 md:mb-0 md:mr-6">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
                <Image 
                  src={profilePicture}
                  alt={`${user.name}'s profile picture`}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{user.name}</h1>
              <p className="text-[var(--text-secondary)] mb-2">
                {user.role === 'admin' ? (
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold mr-2">
                    Admin
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mr-2">
                    Member
                  </span>
                )}
                <span className="flex items-center justify-center md:justify-start mt-2 text-sm">
                  <FaCalendarAlt className="mr-1" /> Joined {new Date(user.joined_date || user.created_at || Date.now()).toLocaleDateString()}
                </span>
              </p>
              
              {user.location && (
                <p className="flex items-center justify-center md:justify-start text-sm text-[var(--text-secondary)] mb-2">
                  <FaMapMarkerAlt className="mr-1" /> {user.location}
                </p>
              )}
              
              <p className="text-[var(--text-secondary)] mt-3">
                {user.bio || 'No bio provided yet.'}
              </p>
            </div>
          </div>
        </div>
        
        {editMode ? (
          <div className="bg-[var(--background-card)] rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Edit Profile</h2>
              <button
                onClick={() => setEditMode(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            {/* Edit Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'general'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  General Information
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'password'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'appearance'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Appearance
                </button>
              </nav>
            </div>
            
            {/* Status Messages */}
            {updateError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{updateError}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-green-700">{successMessage}</p>
              </div>
            )}
            
            {/* General Information Tab */}
            {activeTab === 'general' && (
              <form onSubmit={handleProfileUpdate}>
                <div className="mb-4">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="name">
                    <FaUser className="inline mr-2" /> Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Your name"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="profile_picture">
                    <FaUpload className="inline mr-2" /> Profile Picture
                  </label>
                  
                  <div className="flex items-center mb-2">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border border-gray-200">
                      <Image
                        src={formData.profile_picture || defaultAvatar}
                        alt="Profile preview"
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <button
                        type="button"
                        onClick={handleFileClick}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                        disabled={updateLoading}
                      >
                        <FaUpload className="mr-2" />
                        <span>Choose File</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, or GIF. Max size 5MB.
                      </p>
                    </div>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="location">
                    <FaMapMarkerAlt className="inline mr-2" /> Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Your location"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={4}
                    placeholder="Tell us about yourself"
                  ></textarea>
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}
            
            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordUpdate}>
                <div className="mb-4">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="currentPassword">
                    <FaLock className="inline mr-2" /> Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter your current password"
                      required
                    />
                    <button 
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-gray-400" />
                      ) : (
                        <FaEye className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="newPassword">
                    <FaLock className="inline mr-2" /> New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters long.
                  </p>
                </div>
                
                <div className="mb-6">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2" htmlFor="confirmPassword">
                    <FaLock className="inline mr-2" /> Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            )}
            
            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <form onSubmit={handleProfileUpdate}>
                <div className="mb-6">
                  <label className="block text-[var(--text-secondary)] text-sm font-bold mb-2">
                    <FaPalette className="inline mr-2" /> Profile Header Color
                  </label>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleColorSelect(color.value)}
                        className={`w-full h-16 rounded-lg border-2 transition-all ${
                          formData.profile_color === color.value 
                            ? 'border-white shadow-lg scale-105' 
                            : 'border-transparent hover:scale-105'
                        } bg-gradient-to-r ${color.value}`}
                        aria-label={`Select ${color.name} theme`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select a color for your profile header.
                  </p>
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[var(--background-card)] rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 mr-4">
                    <FaLeaf className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Contributions</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">{user?.contributions_count || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--background-card)] rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 mr-4">
                    <FaTree className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Trees Added</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {userActivity.filter(a => a.activity_type === 'upload' && a.content_type === 'tree').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[var(--background-card)] rounded-xl shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-amber-100 mr-4">
                    <FaImages className="text-amber-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Gallery Photos</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {userGalleryImages.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-[var(--background-card)] rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Recent Activity</h2>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActivityTab('all')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      activityTab === 'all' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setActivityTab('likes')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      activityTab === 'likes' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Likes
                  </button>
                  <button 
                    onClick={() => setActivityTab('uploads')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      activityTab === 'uploads' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Uploads
                  </button>
                  <button 
                    onClick={() => setActivityTab('feedback')}
                    className={`px-3 py-1 text-sm rounded-full ${
                      activityTab === 'feedback' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Feedback
                  </button>
                </div>
              </div>
              
              {activityLoading ? (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-[var(--text-secondary)]">Loading your activity...</p>
                </div>
              ) : (
                <>
                  {/* All Activity Tab */}
                  {activityTab === 'all' && (
                    userActivity.length > 0 ? (
                      <div className="space-y-4">
                        {userActivity.map((activity, index) => (
                          <div key={activity.id || index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                            <ActivityItem activity={activity} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-[var(--text-secondary)]">
                        <p className="mb-4">No recent activity to display.</p>
                        <Link 
                          href="/Explore_Map" 
                          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          Explore the Map
                        </Link>
                      </div>
                    )
                  )}
                  
                  {/* Likes Tab */}
                  {activityTab === 'likes' && (
                    userLikes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DEBUG_MODE && (
                          <div className="col-span-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <p className="font-semibold mb-1">Debug Info:</p>
                            <p>Found {userLikes.length} liked items</p>
                            <details>
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Data</summary>
                              <pre className="mt-2 p-2 bg-gray-100 overflow-auto max-h-40">
                                {JSON.stringify(userLikes, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                        
                        {userLikes.map((like: any, index: number) => (
                          <div 
                            key={`like-${like.id || index}`} 
                            className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden relative">
                              {like.image_url ? (
                                <Image
                                  src={like.image_url}
                                  alt={like.title || 'Liked content'}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[var(--text-primary)]">
                                {like.title || like.content_type || 'Liked item'}
                              </h4>
                              <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                {like.description || 'No description available'}
                              </p>
                              <div className="flex items-center text-xs text-[var(--text-tertiary)] mt-2">
                                <span className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(like.created_at).toLocaleDateString()}
                                </span>
                                {like.user_name && (
                                  <span className="flex items-center ml-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    By {like.user_name}
                                  </span>
                                )}
                                {like.like_count > 0 && (
                                  <span className="flex items-center ml-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {like.like_count}
                                  </span>
                                )}
                              </div>
                              <Link 
                                href={`/Gallery?view=${like.id}`}
                                className="text-xs text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
                              >
                                View item
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <p className="mt-2 text-[var(--text-secondary)]">You haven't liked any content yet.</p>
                        <Link href="/Gallery" className="inline-block mt-4 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                          Explore the Gallery
                        </Link>
                      </div>
                    )
                  )}
                  
                  {/* Uploads Tab */}
                  {activityTab === 'uploads' && (
                    userGalleryImages.length > 0 ? (
                      <div>
                        {DEBUG_MODE && (
                          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <p className="font-semibold mb-1">Debug Info:</p>
                            <p>Found {userGalleryImages.length} uploaded images</p>
                            <details>
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Data</summary>
                              <pre className="mt-2 p-2 bg-gray-100 overflow-auto max-h-40">
                                {JSON.stringify(userGalleryImages, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {userGalleryImages.map((image, index) => (
                            <div key={image.id || index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                              <div className="relative h-48">
                                <Link href={`/Gallery?view=${image.id}`}>
                                  <Image 
                                    src={image.image_url} 
                                    alt={image.title || `Gallery image ${index + 1}`} 
                                    fill
                                    className="object-cover"
                                  />
                                </Link>
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {image.title || `Gallery image ${index + 1}`}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                  {image.description}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Uploaded on {new Date(image.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {image.view_count}
                                  </span>
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    {image.like_count}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-[var(--text-secondary)]">
                        <p className="mb-4">You haven't uploaded any photos yet.</p>
                        <Link 
                          href="/Gallery" 
                          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          Share a Photo
                        </Link>
                      </div>
                    )
                  )}
                  
                  {/* Feedback Tab */}
                  {activityTab === 'feedback' && (
                    userFeedback.length > 0 ? (
                      <div className="space-y-4">
                        {userFeedback.map((feedback, index) => (
                          <div 
                            key={feedback.id || index} 
                            className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm 
                                      ${feedback.admin_reply ? 'border-l-4 border-green-500' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {feedback.subject}
                                {feedback.admin_reply && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Replied
                                  </span>
                                )}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                feedback.status === 'new' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                  : feedback.status === 'read'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {feedback.status === 'new' ? 'New' : feedback.status === 'read' ? 'Read' : 'Replied'}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{feedback.message}</p>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                            </p>
                            
                            {feedback.admin_reply && (
                              <div className="mt-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-2 border-green-500">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Admin Reply:</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{feedback.admin_reply}</p>
                                {feedback.reply_date && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Replied on {new Date(feedback.reply_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center text-[var(--text-secondary)]">
                        <p className="mb-4">You haven't submitted any feedback yet.</p>
                        <Link 
                          href="/feedback" 
                          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          Submit Feedback
                        </Link>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Helper component to display activity items
function ActivityItem({ activity }: { activity: any }) {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'view':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>;
      case 'like':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>;
      case 'upload':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
        </svg>;
      case 'feedback':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>;
    }
  };
  
  const getActivityText = () => {
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
  
  const getActivityLink = () => {
    if (activity.content_type === 'gallery') {
      return `/Gallery?view=${activity.content_id}`;
    } else if (activity.content_type === 'tree') {
      return `/Explore_Map?tree=${activity.content_id}`;
    } else if (activity.content_type === 'feedback') {
      return `/feedback`;
    }
    return '#';
  };
  
  const getActivityDetails = () => {
    if (!activity.details) return null;
    
    if (activity.content_type === 'gallery') {
      return activity.details.title || 'Untitled photo';
    } else if (activity.content_type === 'tree') {
      return activity.details.name || activity.details.scientific_name || 'Unnamed tree';
    } else if (activity.content_type === 'feedback') {
      return activity.details.subject || 'Feedback';
    }
    return null;
  };
  
  // Add a new function to get content image
  const getContentImage = () => {
    if (activity.content_image_url) {
      return activity.content_image_url;
    }
    
    if (activity.contentDetails && activity.contentDetails.image_url) {
      return activity.contentDetails.image_url;
    }
    
    // Default placeholder based on content type
    if (activity.content_type === 'gallery') {
      return '/placeholder-image.jpg';
    } else if (activity.content_type === 'tree') {
      return '/placeholder-tree.jpg';
    }
    
    return '/placeholder.jpg';
  };
  
  return (
    <div className="flex items-start">
      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 mr-3">
        {getActivityIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-start">
          <div className="flex-1">
            <p className="text-[var(--text-primary)] font-medium">
              {getActivityText()}
            </p>
            {getActivityDetails() && (
              <p className="text-sm text-[var(--text-secondary)]">
                "{getActivityDetails()}"
              </p>
            )}
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {new Date(activity.created_at).toLocaleString()}
            </p>
          </div>
          
          {/* Show image thumbnail if available */}
          {(activity.content_image_url || (activity.contentDetails && activity.contentDetails.image_url)) && (
            <div className="ml-3 w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative">
              <Image
                src={getContentImage()}
                alt={getActivityDetails() || 'Activity content'}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
        
        {/* Add link to content if applicable */}
        <Link 
          href={getActivityLink()}
          className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block"
        >
          View {activity.content_type}
        </Link>
      </div>
    </div>
  );
} 