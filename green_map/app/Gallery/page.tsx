"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import AnimatedSection from "../../components/AnimatedSection";
import { useTheme } from "../../components/ThemeProvider";
import "./Gallery.css";
import { useSession } from 'next-auth/react';

interface GalleryImage {
  id: number;
  image_url: string;
  title: string;
  description: string;
  user_name: string;
  tree_id: number | null;
  approved: boolean;
  created_at: string;
  view_count?: number;
  like_count?: number;
}

export default function GalleryPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { data: session, status } = useSession();
  
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    user_name: "",
    user_email: "",
    tree_id: "",
    image: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [userLikes, setUserLikes] = useState<number[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setIsLoggedIn(true);
      setUser(session.user);
      
      // Pre-fill the form with user data if available
      setUploadForm(prev => ({
        ...prev,
        user_name: session.user.name || '',
        user_email: session.user.email || ''
      }));
      
      fetchUserLikes();
    } else if (status === 'unauthenticated') {
      setIsLoggedIn(false);
      setUser(null);
      setUserLikes([]);
    }
  }, [session, status]);

  useEffect(() => {
    fetchImages();
    
    // Listen for auth state changes from other components
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-state-change') {
        console.log('Auth state change detected via storage event');
      }
    };

    const handleLoginSuccess = () => {
      console.log('Login success event detected');
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('login-success', handleLoginSuccess as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('login-success', handleLoginSuccess as EventListener);
    };
  }, []);

  async function fetchImages(retry = true) {
    try {
      setLoading(true);
      console.log('Fetching gallery images...');
      
      const response = await fetch('/api/gallery', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.images?.length || 0} gallery images`);
      setImages(data.images || []);
      setError(null);
      
      // If user is logged in, fetch their likes
      if (isLoggedIn && user) {
        console.log('User is logged in, fetching likes...');
        fetchUserLikes();
      }
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      setError(error instanceof Error ? error.message : 'Failed to load gallery images');
      
      // If the fetch failed and retry is enabled, try again after a delay
      if (retry) {
        console.log('Retrying image fetch in 3 seconds...');
        setTimeout(() => {
          fetchImages(false); // Don't retry again to avoid infinite loop
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  // Fetch likes for the logged-in user
  const fetchUserLikes = async () => {
    if (!isLoggedIn) {
      console.log('Not fetching likes because user is not logged in');
      setUserLikes([]);
      return;
    }
    
    try {
      const response = await fetch('/api/user/likes?type=gallery', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('User likes data:', data);
        
        if (Array.isArray(data.likes)) {
          const contentIds = data.likes.map((like: any) => like.content_id);
          console.log('Content IDs from likes:', contentIds);
          setUserLikes(contentIds);
        } else {
          console.warn('Likes data is not an array:', data.likes);
          setUserLikes([]);
        }
      } else if (response.status === 401) {
        console.log('User not authenticated for likes. Session may have expired.');
        // Don't clear the login state here as we're using NextAuth now
        setUserLikes([]);
      } else {
        console.error('Failed to fetch likes:', response.status, response.statusText);
        setUserLikes([]);
      }
    } catch (error) {
      console.error('Error fetching user likes:', error);
      setUserLikes([]);
    }
  };
  
  // Handle image like
  const handleLikeImage = async (imageId: number) => {
    if (!isLoggedIn) {
      setMessage({ 
        text: "Please sign in to like photos", 
        type: "error" 
      });
      return;
    }
    
    try {
      const isLiked = userLikes.includes(imageId);
      console.log(`Image ${imageId} is${isLiked ? '' : ' not'} liked. Performing ${isLiked ? 'unlike' : 'like'} operation.`);
      
      const response = await fetch('/api/user/likes', {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          content_type: 'gallery',
          content_id: imageId
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log(`Successfully ${isLiked ? 'unliked' : 'liked'} image ${imageId}`);
        
        // Update local state
        if (isLiked) {
          setUserLikes(userLikes.filter(id => id !== imageId));
          // Decrement like count
          setImages(images.map(img => 
            img.id === imageId 
              ? {...img, like_count: Math.max((img.like_count || 0) - 1, 0)}
              : img
          ));
        } else {
          setUserLikes([...userLikes, imageId]);
          // Increment like count
          setImages(images.map(img => 
            img.id === imageId 
              ? {...img, like_count: (img.like_count || 0) + 1}
              : img
          ));
        }
        
        // Show success message
        setMessage({ 
          text: isLiked ? "Photo unliked" : "Photo liked!", 
          type: "success" 
        });
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 3000);
      } else if (response.status === 401) {
        console.log('User not authenticated. Will try to reauthenticate...');
        // User session might have expired, clear state and trigger reauth
        setIsLoggedIn(false);
        setUser(null);
        
        setMessage({ 
          text: "Your session has expired. Please sign in again to like photos.", 
          type: "error" 
        });
        
        // Clear the message after a few seconds
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 5000);
      } else {
        console.error('Like operation failed:', response.status, response.statusText);
        let errorMessage = "Failed to process like";
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        setMessage({ text: errorMessage, type: "error" });
      }
    } catch (error) {
      console.error('Error processing like:', error);
      setMessage({ text: "Failed to like image", type: "error" });
    }
  };
  
  // Track image view
  const handleViewImage = async (image: GalleryImage) => {
    try {
      setSelectedImage(image);
      
      // Increment view count in the UI immediately
      setImages(images.map(img => 
        img.id === image.id 
          ? {...img, view_count: (img.view_count || 0) + 1}
          : img
      ));
      
      // Update view count in the database
      const response = await fetch(`/api/gallery/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ imageId: image.id }),
        credentials: 'include'
      });
      
      if (!response.ok && response.status !== 401) {
        // We don't need to show errors for view counts to users
        // Just log it for debugging
        console.error('Failed to update view count:', response.status);
      }
    } catch (error) {
      console.error('Error updating view count:', error);
      // We won't show this error to users
    }
  };
  
  // Close image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadForm(prev => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in before proceeding
    if (!isLoggedIn || !user) {
      setMessage({ text: "Please sign in to share your photos", type: "error" });
      return;
    }
    
    if (!uploadForm.image) {
      setMessage({ text: "Please select an image to upload", type: "error" });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("title", uploadForm.title);
      formData.append("description", uploadForm.description);
      formData.append("user_name", uploadForm.user_name);
      formData.append("user_email", uploadForm.user_email);
      
      if (uploadForm.tree_id) {
        formData.append("tree_id", uploadForm.tree_id);
      }
      
      formData.append("image", uploadForm.image);
      
      const response = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        // Handle error responses
        try {
          const text = await response.text();
          let errorMessage = `Failed to upload image: ${response.status} ${response.statusText}`;
          
          if (text && text.trim() !== '') {
            const errorData = JSON.parse(text);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          }
          
          throw new Error(errorMessage);
        } catch (jsonError) {
          // If JSON parsing fails, use the caught error
          throw new Error(jsonError instanceof Error ? jsonError.message : "Failed to upload image");
        }
      }
      
      // Handle successful response
      try {
        const text = await response.text();
        if (!text || text.trim() === '') {
          console.warn('Empty response from upload API');
          setMessage({ text: "Image uploaded successfully! It will be reviewed before appearing in the gallery.", type: "success" });
        } else {
          const data = JSON.parse(text);
          setMessage({ text: data.message || "Image uploaded successfully! It will be reviewed before appearing in the gallery.", type: "success" });
        }
      } catch (jsonError) {
        // Even if parsing fails, consider it a success as the response was ok
        console.warn('Could not parse upload response JSON:', jsonError);
        setMessage({ text: "Image uploaded successfully! It will be reviewed before appearing in the gallery.", type: "success" });
      }
      
      setUploadForm({
        title: "",
        description: "",
        user_name: "",
        user_email: "",
        tree_id: "",
        image: null,
      });
      
      // Close the form after successful upload
      setTimeout(() => {
        setShowUploadForm(false);
        // Clear the message after a delay
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }, 2000);
      
      // Refresh the gallery to show the new image if approved
      fetchImages();
      
    } catch (err) {
      console.error("Error uploading image:", err);
      setMessage({ text: err instanceof Error ? err.message : "Failed to upload image", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  // Format the date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Item animation variants
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 20
      }
    }
  };

  const buttonVariants: Variants = {
    hover: { 
      scale: 1.05, 
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
    },
    tap: { scale: 0.95 }
  };

  // Add a function to handle the click on the upload button
  const handleUploadClick = () => {
    if (!isLoggedIn || !user) {
      setMessage({ text: "Please sign in to share your photos", type: "error" });
      return;
    }
    setShowUploadForm(true);
  };

  const toggleFilters = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const setFilter = (filter: string) => {
    setActiveFilter(filter);
  };

  // Filter images based on active filter (could connect to real filtering later)
  const filteredImages = activeFilter === 'all' ? images : images;

  return (
    <AnimatedSection className="gallery-container" delay={0.2}>
      <motion.div 
        className="gallery-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h1 className="gallery-title">Green Map Gallery</h1>
        <p className="gallery-description">
          Explore beautiful photographs of trees and nature from our community.
          Share your own experiences and help us document the natural beauty around us.
        </p>
      </motion.div>

      <div className="gallery-controls">
        <div className="flex items-center space-x-3">
          <motion.button 
            className="filter-toggle-btn"
            onClick={toggleFilters}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </motion.button>
          
          <AnimatePresence>
            {isFilterVisible && (
              <motion.div 
                className="filter-options"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <button 
                  className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All Photos
                </button>
                <button 
                  className={`filter-btn ${activeFilter === 'recent' ? 'active' : ''}`}
                  onClick={() => setFilter('recent')}
                >
                  Recent
                </button>
                <button 
                  className={`filter-btn ${activeFilter === 'popular' ? 'active' : ''}`}
                  onClick={() => setFilter('popular')}
                >
                  Popular
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center">
          {message.text && (
            <motion.div 
              className={`message ${message.type}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {message.text}
            </motion.div>
          )}
          
          {isLoggedIn ? (
            <motion.button
              className="upload-button"
              onClick={handleUploadClick}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Share Your Photo
            </motion.button>
          ) : (
            <motion.div 
              className="login-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p>Please <Link href="/login?redirect=/Gallery" className="login-link">sign in</Link> to share your photos.</p>
            </motion.div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="loading-spinner" />
          <p className="text-gray-500 mt-4 animate-pulse">Loading amazing photos...</p>
        </div>
      ) : error ? (
        <motion.div 
          className={`message error`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>Error: {error}. Please try again.</p>
          <motion.button
            className="retry-btn mt-2"
            onClick={fetchImages}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.button>
        </motion.div>
      ) : filteredImages.length === 0 ? (
        <motion.div 
          className="empty-gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl font-semibold mb-2">No images found in the gallery.</p>
          <p className="text-gray-500 mb-6">Be the first to share your photo!</p>
          
          {isLoggedIn ? (
            <motion.button
              className="upload-button"
              onClick={handleUploadClick}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Share Your Photo
            </motion.button>
          ) : (
            <Link href="/login?redirect=/Gallery" className="login-link-btn">
              Sign In to Share
            </Link>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className="gallery-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredImages.map((image, index) => (
            <motion.div
              key={image.id}
              className="gallery-item"
              variants={itemVariants}
              whileHover="hover"
              layout
            >
              <div className="gallery-image-container" onClick={() => handleViewImage(image)}>
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="gallery-image"
                  priority={index < 4}
                />
                <div className="image-overlay">
                  <div className="image-actions">
                    <button 
                      className={`image-action-btn ${userLikes.includes(image.id) ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeImage(image.id);
                      }}
                      aria-label={userLikes.includes(image.id) ? "Unlike this image" : "Like this image"}
                      title={userLikes.includes(image.id) ? "Unlike this image" : "Like this image"}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5" 
                        fill={userLikes.includes(image.id) ? "currentColor" : "none"}
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {(image.like_count ?? 0) > 0 && (
                        <span className="like-count">{image.like_count ?? 0}</span>
                      )}
                    </button>
                    <button 
                      className="image-action-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewImage(image);
                      }}
                      aria-label="View full size image"
                      title="View full size image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="gallery-content">
                <h3 className="gallery-item-title">{image.title}</h3>
                <p className="gallery-item-description">{image.description}</p>
                <div className="gallery-item-meta">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {image.user_name}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(image.created_at)}
                  </span>
                </div>
                <div className="gallery-item-stats flex items-center mt-2 text-sm text-gray-500">
                  <span className="flex items-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {image.view_count || 0}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${userLikes.includes(image.id) ? 'text-red-500 fill-current' : ''}`} fill={userLikes.includes(image.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {(image.like_count ?? 0) > 0 && (
                      <span className="like-count">{image.like_count ?? 0}</span>
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showUploadForm && (
          <motion.div
            className="upload-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="upload-form"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="form-header">
                <h2 className="form-title">Share Your Photo</h2>
                <button
                  className="close-button"
                  onClick={() => setShowUploadForm(false)}
                >
                  &times;
                </button>
              </div>

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="title">
                    Title*
                  </label>
                  <motion.input
                    type="text"
                    id="title"
                    name="title"
                    className="form-input"
                    value={uploadForm.title}
                    onChange={handleInputChange}
                    required
                    whileFocus={{ scale: 1.01, borderColor: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">
                    Description*
                  </label>
                  <motion.textarea
                    id="description"
                    name="description"
                    className="form-textarea"
                    value={uploadForm.description}
                    onChange={handleInputChange}
                    required
                    whileFocus={{ scale: 1.01, borderColor: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="user_name">
                    Your Name*
                  </label>
                  <motion.input
                    type="text"
                    id="user_name"
                    name="user_name"
                    className="form-input"
                    value={uploadForm.user_name}
                    onChange={handleInputChange}
                    required
                    readOnly={isLoggedIn && user}
                    whileFocus={{ scale: 1.01, borderColor: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="user_email">
                    Your Email*
                  </label>
                  <motion.input
                    type="email"
                    id="user_email"
                    name="user_email"
                    className="form-input"
                    value={uploadForm.user_email}
                    onChange={handleInputChange}
                    required
                    readOnly={isLoggedIn && user}
                    whileFocus={{ scale: 1.01, borderColor: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="tree_id">
                    Related Tree ID (Optional)
                  </label>
                  <motion.input
                    type="text"
                    id="tree_id"
                    name="tree_id"
                    className="form-input"
                    value={uploadForm.tree_id}
                    onChange={handleInputChange}
                    whileFocus={{ scale: 1.01, borderColor: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="image">
                    Select Image*
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    className="form-file-input"
                    onChange={handleFileChange}
                    accept="image/*"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Accepted formats: JPG, PNG. Max size: 5MB
                  </p>
                </div>

                <motion.button
                  type="submit"
                  className="form-submit"
                  disabled={isUploading}
                  whileHover={!isUploading ? { scale: 1.02 } : {}}
                  whileTap={!isUploading ? { scale: 0.98 } : {}}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : "Upload Photo"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="fullsize-image-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeImageModal}
          >
            <motion.div 
              className="fullsize-image-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fullsize-image-wrapper">
                <Image
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 80vw"
                  className="object-contain"
                  priority
                />
              </div>
              
              <div className="fullsize-image-details">
                <h2 className="text-2xl font-bold mb-2">{selectedImage.title}</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{selectedImage.description}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {selectedImage.user_name}
                  </span>
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(selectedImage.created_at)}
                  </span>
                </div>
                
                <div className="flex space-x-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoggedIn) {
                        setMessage({
                          text: "Please sign in to like photos",
                          type: "error"
                        });
                        setTimeout(() => {
                          closeImageModal();
                        }, 2000);
                        return;
                      }
                      handleLikeImage(selectedImage.id);
                    }} 
                    className={`flex items-center space-x-1 px-4 py-2 rounded-full ${
                      userLikes.includes(selectedImage.id) 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill={userLikes.includes(selectedImage.id) ? "currentColor" : "none"} 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{selectedImage.like_count ?? 0} {userLikes.includes(selectedImage.id) ? 'Liked' : 'Like'}</span>
                  </button>
                </div>
              </div>
              
              <button 
                className="fullsize-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  closeImageModal();
                }}
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
} 