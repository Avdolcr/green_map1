"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./explore.css";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import AnimatedSection from "../../components/AnimatedSection";
import { useTheme } from "../../components/ThemeProvider";
import { FaSearch, FaTimes, FaTree, FaMapMarkedAlt, FaInfoCircle, FaLeaf, FaSeedling, FaExpand } from "react-icons/fa";

// Fix default icon issues with Leaflet in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
});

// Custom markers with different colors based on tree status
const greenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orangeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Enhanced animation variants with more advanced transitions
const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96,
    transition: { 
      duration: 0.7,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const mapContainerVariants = {
  initial: { opacity: 0, y: 30, filter: "blur(10px)" },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.2,
      ease: [0.2, 0.65, 0.3, 0.9],
    }
  }
};

const listContainerVariants = {
  initial: { opacity: 0, x: 40, filter: "blur(8px)" },
  animate: { 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: [0.25, 0.1, 0.25, 1],
      delayChildren: 0.3,
      staggerChildren: 0.07
    }
  }
};

const listItemVariants = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.2, 0.65, 0.3, 0.9]
    }
  }
};

const detailsVariants = {
  initial: { opacity: 0, y: 40, scale: 0.97, filter: "blur(8px)" },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.2, 0.65, 0.3, 0.9],
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.97,
    filter: "blur(8px)",
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const imageVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.9,
      ease: [0.2, 0.65, 0.3, 0.9]
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 1, 1]
    }
  }
};

const infoVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.2, 0.65, 0.3, 0.9],
      delayChildren: 0.3,
      staggerChildren: 0.1
    }
  }
};

const infoItemVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.2, 0.65, 0.3, 0.9]
    }
  }
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1]
    }
  }
};

// Define the Tree type
interface Tree {
  id: number;
  name: string;
  scientific_name: string;
  gen_info: string;
  distribution: string;
  location: string;
  image_url?: string;
  pin_icon?: string;
  pin_location_img?: string;
  tree_status: string;
  family_name?: string;
  lat?: number;
  lng?: number;
}

// Add before the Tree interface
interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText: string;
}

// Add the ImageModal component before the RecenterMap component
const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl, altText }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Add escape key handler to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div 
            className="modal-container"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <button 
              className="modal-close" 
              onClick={onClose}
              aria-label="Close image"
            >
              <FaTimes />
            </button>
            
            <div className="modal-image-container">
              {imageUrl && (
                <img 
                  src={imageUrl} 
                  alt={altText} 
                  className="modal-image"
                  onError={(e) => {
                    // Show a fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const container = target.parentElement;
                    if (container) {
                      const fallback = document.createElement('div');
                      fallback.className = 'img-placeholder';
                      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" style="opacity: 0.4;"><path fill="currentColor" d="M21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5M11,7A2,2 0 0,0 9,9A2,2 0 0,0 11,11A2,2 0 0,0 13,9A2,2 0 0,0 11,7M5,19H19V11.1C19,11.1 14.43,15 13.5,15C12.57,15 10.55,11.1 9.53,11.1C8.5,11.1 5,14.1 5,14.1V19Z" /></svg><p>Image not available</p>';
                      container.appendChild(fallback);
                    }
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * A helper component that re-centers the map whenever the center or zoom props change.
 * This is crucial for ensuring the map updates when clicking on trees in the list.
 */
function RecenterMap({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  
  // Add a reference to track if a recenter operation is in progress
  const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    try {
      // Clear any existing timeout to prevent multiple recenter operations
      if (recenterTimeoutRef.current) {
        clearTimeout(recenterTimeoutRef.current);
      }
      
      // Only proceed if center is a valid array with two numeric coordinates
      if (!center || !Array.isArray(center) || center.length !== 2) {
        return;
      }
      
      // Extract coordinates and validate them explicitly
      const [lat, lng] = center;
      
      if (typeof lat !== 'number' || isNaN(lat) || 
          typeof lng !== 'number' || isNaN(lng)) {
        return;
      }
      
      // Extra bounds checking for valid latitude/longitude ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn("Coordinates out of range:", lat, lng);
        return;
      }
      
      // Create a proper Leaflet LatLng object to avoid type errors
      const validLatLng = L.latLng(lat, lng);
      
      // Use a small delay before executing the recenter operation
      recenterTimeoutRef.current = setTimeout(() => {
        // Use flyTo for a smoother animated transition with higher duration
        map.flyTo(validLatLng, zoom, {
          duration: 1.2,  // Longer animation for smoother experience
          easeLinearity: 0.25
        });
        
        // Force the map to invalidate size to handle any container size issues
        setTimeout(() => {
          map.invalidateSize({animate: true});
        }, 300);
      }, 100); // Slightly longer delay for better reliability
    } catch (e) {
      console.error("Error in RecenterMap:", e);
    }
    
    // Cleanup function to clear timeout on unmount
    return () => {
      if (recenterTimeoutRef.current) {
        clearTimeout(recenterTimeoutRef.current);
      }
    };
  }, [center, zoom, map]);
  
  return null;
}

/**
 * Attempts to parse the coordinates for a tree.
 */
function parseCoordinates(tree: Tree): [number, number] | null {
  // Try to extract coordinates directly from lat/lng if available
  if (tree.lat !== undefined && tree.lng !== undefined &&
      !isNaN(tree.lat) && !isNaN(tree.lng) &&
      tree.lat >= -90 && tree.lat <= 90 &&
      tree.lng >= -180 && tree.lng <= 180) {
    return [tree.lat, tree.lng];
  }

  // Try to parse from location string if it's a JSON structure
  if (tree.location) {
    try {
      // Attempt to parse location as JSON
      const locationData = JSON.parse(tree.location);
      
      // If it's an array of location objects
      if (Array.isArray(locationData) && locationData.length > 0) {
        // Check for coord property in the format used in the database
        // [{"coord":[lat,lng],"icon":"url","image":"url"}]
        const firstLocation = locationData[0];
        
        // Handle format with coord property as array
        if (firstLocation.coord && Array.isArray(firstLocation.coord) && firstLocation.coord.length >= 2) {
          const lat = parseFloat(String(firstLocation.coord[0]));
          const lng = parseFloat(String(firstLocation.coord[1]));
          
          if (!isNaN(lat) && !isNaN(lng) &&
              lat >= -90 && lat <= 90 &&
              lng >= -180 && lng <= 180) {
            return [lat, lng];
          }
        }
        
        // Handle format with coord property as string
        if (firstLocation.coord && typeof firstLocation.coord === 'string' && firstLocation.coord.includes(',')) {
          const parts = firstLocation.coord.split(',');
          if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            
            if (!isNaN(lat) && !isNaN(lng) &&
                lat >= -90 && lat <= 90 &&
                lng >= -180 && lng <= 180) {
              return [lat, lng];
            }
          }
        }
        
        // Handle case where it's an array of arrays
        if (Array.isArray(firstLocation) && firstLocation.length >= 2) {
          const lat = parseFloat(String(firstLocation[0]));
          const lng = parseFloat(String(firstLocation[1]));
          
          if (!isNaN(lat) && !isNaN(lng) &&
              lat >= -90 && lat <= 90 &&
              lng >= -180 && lng <= 180) {
            return [lat, lng];
          }
        }
        
        // Handle case where it's an array of objects with lat/lng properties
        if (firstLocation.lat !== undefined && firstLocation.lng !== undefined) {
          const lat = parseFloat(String(firstLocation.lat));
          const lng = parseFloat(String(firstLocation.lng));
          
          if (!isNaN(lat) && !isNaN(lng) &&
              lat >= -90 && lat <= 90 &&
              lng >= -180 && lng <= 180) {
            return [lat, lng];
          }
        }
      }
      
      // If it's a single object with lat/lng properties
      if (locationData.lat !== undefined && locationData.lng !== undefined) {
        const lat = parseFloat(String(locationData.lat));
        const lng = parseFloat(String(locationData.lng));
        
        if (!isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180) {
          return [lat, lng];
        }
      }
    } catch (e) {
      console.warn("Error parsing location JSON:", e);
    }

    // Try to extract coordinates from string with format like "16.123, 120.456"
    if (typeof tree.location === 'string') {
    const coordinateRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
    const match = tree.location.match(coordinateRegex);
    if (match && match.length >= 3) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180) {
        return [lat, lng];
        }
      }
    }
  }
  
  // If no coordinates found, return null
  return null;
}

// Add this helper function to parse all coordinates for a tree
function parseAllCoordinates(tree: Tree): [number, number][] {
  try {
    // Check if tree exists and has a location property
    if (!tree || !tree.location) {
      return [];
    }
    
    // Try to parse as JSON
    try {
      const locations = JSON.parse(tree.location);
      
      if (Array.isArray(locations)) {
        // Process each location in the array
        const coords = locations
          .map((loc) => {
            // Handle the format: {"coord":[lat,lng],"icon":"url","image":"url"}
            if (loc && loc.coord) {
              // Check if coord is an array with two numeric values
              if (Array.isArray(loc.coord) && loc.coord.length === 2) {
                const lat = parseFloat(String(loc.coord[0]));
                const lng = parseFloat(String(loc.coord[1]));
                
                // Validate that these are actual numeric coordinates
                if (!isNaN(lat) && !isNaN(lng) && 
                    lat >= -90 && lat <= 90 && 
                    lng >= -180 && lng <= 180) {
                  return [lat, lng] as [number, number];
                }
              } 
              // Handle case where coord is a string like "16.123,120.456"
              else if (typeof loc.coord === 'string' && loc.coord.includes(',')) {
                const parts = loc.coord.split(',');
                if (parts.length === 2) {
                  const lat = parseFloat(parts[0].trim());
                  const lng = parseFloat(parts[1].trim());
                  
                  if (!isNaN(lat) && !isNaN(lng) && 
                      lat >= -90 && lat <= 90 && 
                      lng >= -180 && lng <= 180) {
                    return [lat, lng] as [number, number];
                  }
                }
              }
            }
            
            // Skip string values like "Philippines" that aren't proper coordinates
            return null;
          })
          .filter(coord => coord !== null) as [number, number][];
        
        // Return only the valid coordinates we found
        return coords;
      }
    } catch (error) {
      console.warn("Error parsing location JSON:", error);
    }
    
    // Try to handle string format coordinates
    if (typeof tree.location === 'string') {
      // Try comma-separated format like "16.123,120.456"
      if (tree.location.includes(',')) {
        const parts = tree.location.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
      return [[lat, lng]];
          }
        }
      }
      
      // Try more complex string parsing - look for numbers with decimals
      const matches = tree.location.match(/-?\d+\.\d+/g);
      if (matches && matches.length >= 2) {
        const lat = parseFloat(matches[0]);
        const lng = parseFloat(matches[1]);
        
        if (!isNaN(lat) && !isNaN(lng) && 
            lat >= -90 && lat <= 90 && 
            lng >= -180 && lng <= 180) {
          return [[lat, lng]];
        }
      }
    }
    
    // If tree has explicit lat and lng properties, use those as fallback
    if (tree.lat !== undefined && tree.lng !== undefined && 
        !isNaN(tree.lat) && !isNaN(tree.lng) &&
        tree.lat >= -90 && tree.lat <= 90 && 
        tree.lng >= -180 && tree.lng <= 180) {
      return [[tree.lat, tree.lng]];
    }
    
    // Return empty array if no valid coordinates found
    return [];
  } catch (error) {
    console.error("Error in parseAllCoordinates:", error);
    // Return empty array in case of error
    return [];
  }
}

// Function to get the appropriate tree icon based on tree status or custom pin_icon
function getTreeIcon(tree: Tree) {
  // First check if the tree has a custom pin_icon specified
  if (tree.pin_icon && typeof tree.pin_icon === 'string' && tree.pin_icon.trim() !== '') {
    return L.icon({
      iconUrl: tree.pin_icon,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
  
  // Fallback to status-based coloring
  if (!tree.tree_status) return greenIcon; // Default to green if no status
  
  const status = tree.tree_status.toLowerCase();
  
  if (status.includes('endangered') || status.includes('critical') || status.includes('vulnerable')) {
    return redIcon;
  } else if (status.includes('threatened') || status.includes('concern')) {
    return orangeIcon;
  } else {
    return greenIcon; // Default for "Least Concern" or other statuses
  }
}

export default function ExplorePage() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Set the default center to Naguilian, Philippines
  const defaultCenter: [number, number] = [16.5324, 120.3929]; // Naguilian, La Union, Philippines
  
  const [trees, setTrees] = useState<Tree[]>([]);
  const [filteredTrees, setFilteredTrees] = useState<Tree[]>([]);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Add state to track whether to show only the selected tree
  const [showOnlySelectedTree, setShowOnlySelectedTree] = useState(false);
  
  // Add a reference to the map instance
  const mapRef = useRef<L.Map | null>(null);
  
  const detailsRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: detailsRef,
    offset: ["start end", "end start"]
  });
  
  const detailsOpacity = useTransform(scrollYProgress, [0, 0.2, 1], [0.4, 1, 1]);
  const detailsScale = useTransform(scrollYProgress, [0, 0.2, 1], [0.98, 1, 1]);
  const detailsY = useTransform(scrollYProgress, [0, 0.2, 1], [30, 0, 0]);

  // Add these new state variables inside the ExplorePage component after the searchQuery state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Add a helper function to open the image modal
  const openImageModal = (imageUrl: string) => {
    if (imageUrl && typeof imageUrl === 'string') {
      // Ensure the URL is properly formatted
      let finalUrl = imageUrl;
      
      // Check if the URL is relative and doesn't start with http/https
      if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        finalUrl = '/' + imageUrl;
      }
      
      console.log("Opening modal with image:", finalUrl);
      setModalImage(finalUrl);
      setIsModalOpen(true);
    } else {
      console.error("Invalid image URL:", imageUrl);
    }
  };

  // Fetch trees from your API (which reads from your MySQL database)
  useEffect(() => {
    fetch("/api/trees")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trees");
        return res.json();
      })
      .then((data) => {
        setTimeout(() => {
          // Check if data.trees exists and is an array
          if (data.trees && Array.isArray(data.trees)) {
            setTrees(data.trees);
            setFilteredTrees(data.trees);
          } else if (Array.isArray(data)) {
            // Fallback in case the API directly returns an array
            setTrees(data);
            setFilteredTrees(data);
          } else {
            // If neither format is valid, set an empty array
            console.error("Invalid data format received from API:", data);
            setTrees([]);
            setFilteredTrees([]);
            setError("Invalid data format received from API");
          }
          setLoading(false);
        }, 600); // Add a short delay for visual effect
      })
      .catch((err: any) => {
        console.error("Error fetching trees:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  // Add an effect to ensure the map is centered on Naguilian when it first loads
  useEffect(() => {
    // This will run once the map reference is available
    if (mapRef.current) {
      // Reset to default center and zoom
      setMapCenter(defaultCenter);
      setMapZoom(13);
      
      // Force the map to center on Naguilian
      setTimeout(() => {
        try {
          mapRef.current?.setView(defaultCenter, 13, {
            animate: true,
            duration: 1.0
          });
          // Invalidate size to ensure proper rendering
          mapRef.current?.invalidateSize();
        } catch (e) {
          console.error("Error centering map:", e);
        }
      }, 800); // Give the map time to fully initialize
    }
  }, [mapRef.current]);
  
  // Filter trees based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTrees(trees);
      return;
    }
    
    const filtered = trees.filter(tree => {
      const searchTerms = searchQuery.toLowerCase().split(' ');
      return searchTerms.every(term => 
        (tree.name?.toLowerCase() || '').includes(term) ||
        (tree.scientific_name?.toLowerCase() || '').includes(term) ||
        (tree.family_name?.toLowerCase() || '').includes(term) ||
        (tree.location?.toLowerCase() || '').includes(term)
      );
    });
    
    setFilteredTrees(filtered);
  }, [searchQuery, trees]);

  // Update map center when selected tree changes
  useEffect(() => {
    if (selectedTree) {
      const coordinates = parseCoordinates(selectedTree);
      if (coordinates && 
          Array.isArray(coordinates) && 
          coordinates.length === 2 &&
          typeof coordinates[0] === 'number' && !isNaN(coordinates[0]) &&
          typeof coordinates[1] === 'number' && !isNaN(coordinates[1])) {
        setMapCenter(coordinates);
        setMapZoom(19); // Use the same higher zoom level (19) for consistency
      }
    }
  }, [selectedTree]);

  // Update additional UI elements when selected tree changes
  useEffect(() => {
    if (selectedTree) {
      // Additional UI updates when a tree is selected can go here
      // We're handling map centering directly in handleTreeSelect
      
      // We could add other tree selection UI effects here if needed
    }
  }, [selectedTree]);

  // Highlight matched text in search results
  const highlightMatch = (text: string) => {
    if (!searchQuery || !text) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  // SearchBar component
  interface SearchBarProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: () => void;
    isFocused: boolean;
    onClear: () => void;
  }

  const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChange,
    onFocus,
    onBlur,
    isFocused,
    onClear
  }) => (
    <motion.div 
      className={`search-container ${isFocused ? 'focused' : ''}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <FaSearch className={`search-icon ${isFocused || value ? 'active' : ''}`} />
      <input
        type="text"
        placeholder="Search by name, scientific name, or family..."
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <AnimatePresence>
      {value && (
        <motion.button 
          className="clear-search"
          onClick={onClear}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaTimes />
        </motion.button>
      )}
      </AnimatePresence>
    </motion.div>
  );

  // Render markers for all coordinates of a tree
  const renderMarkers = (tree: Tree) => {
    // Get all coordinates for this tree - if none are found, it will return an empty array
    const coordinates = parseAllCoordinates(tree);
    
    // If no coordinates, we won't render any markers
    if (!coordinates || coordinates.length === 0) {
      return null;
    }
    
    return coordinates.map((coord, index) => {
      // Check for valid coordinates
      if (!coord || !Array.isArray(coord) || coord.length !== 2 || 
          typeof coord[0] !== 'number' || isNaN(coord[0]) ||
          typeof coord[1] !== 'number' || isNaN(coord[1])) {
        return null;
      }

      // Get the appropriate icon for this specific pin
      let customIcon = null;
      let pinImage = null;
      
      // Check if we have a custom icon and image for this specific coordinate
      try {
        const locations = JSON.parse(tree.location);
        if (Array.isArray(locations) && locations[index]) {
          // Get custom icon if available
          if (locations[index].icon) {
            customIcon = L.icon({
              iconUrl: locations[index].icon,
              shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
          }
          
          // Get pin-specific image if available
          if (locations[index].image) {
            pinImage = locations[index].image;
          }
        }
      } catch (e) {
        // Silently handle parsing errors
      }
      
      // Use custom icon or fall back to the default icon based on tree status
      // For selected trees, we can use a special variant or make it larger
      let icon = customIcon || getTreeIcon(tree);
      
      // If this is the selected tree, make its marker more prominent
      if (selectedTree && tree.id === selectedTree.id) {
        // Create a slightly larger version of the icon for the selected tree
        icon = L.icon({
          iconUrl: icon.options.iconUrl,
          shadowUrl: icon.options.shadowUrl,
          iconSize: [30, 49], // 20% larger
          iconAnchor: [15, 49],
          popupAnchor: [1, -40],
          shadowSize: [41, 41]
        });
      }
      
      return (
        <Marker 
          key={`${tree.id}-${index}`} 
          position={coord}
          icon={icon}
          zIndexOffset={selectedTree && tree.id === selectedTree.id ? 1000 : 0}
          eventHandlers={{
            click: () => {
              // Immediately set the selected tree
              setSelectedTree(tree);
              
              // Enable single tree view mode
              setShowOnlySelectedTree(true);
              
              // Set high zoom level
              setMapZoom(19);
              
              // Update map center with these coordinates
              setMapCenter(coord);
              
              // Use direct map manipulation for immediate effect
              if (mapRef.current) {
                try {
                  mapRef.current.flyTo(coord, 19, {
                    duration: 1.2,
                    easeLinearity: 0.25
                  });
                  
                  // Force invalidate size after a delay to ensure proper rendering
                  setTimeout(() => {
                    mapRef.current?.invalidateSize();
                  }, 300);
                } catch (e) {
                  console.error("Error with map flyTo from marker click:", e);
                }
              }
            }
          }}
        >
          <Popup className="custom-popup">
            <div className="popup-content">
              <h3 className="text-lg font-bold">{tree.name}</h3>
              <p className="text-sm italic text-gray-600">{tree.scientific_name}</p>
              
              {/* Display the correct image for this specific pin */}
              {pinImage ? (
                <div className="popup-image mt-2">
                  <img 
                    src={pinImage} 
                    alt={`${tree.name} location ${index + 1}`}
                    className="w-full h-[150px] object-cover rounded-md"
                    style={{ borderRadius: '6px' }}
                    onError={(e) => {
                      // Fallback if pin image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : tree.pin_location_img ? (
                <div className="popup-image mt-2">
                  <img 
                    src={tree.pin_location_img} 
                    alt={`${tree.name} location`}
                    className="w-full h-[150px] object-cover rounded-md"
                    style={{ borderRadius: '6px' }}
                    onError={(e) => {
                      // Fallback if pin_location_img fails to load
                      const target = e.target as HTMLImageElement;
                      if (tree.image_url) {
                        target.src = tree.image_url;
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                  />
                </div>
              ) : tree.image_url ? (
                <div className="popup-image mt-2">
                  <img 
                    src={tree.image_url} 
                    alt={tree.name}
                    className="w-full h-[150px] object-cover rounded-md"
                    style={{ borderRadius: '6px' }}
                    onError={(e) => {
                      // Hide image if it fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : null}

              <div className="mt-2 flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTreeSelect(tree);
                  }}
                  className="flex-1 bg-[var(--primary)] text-white px-3 py-2 rounded text-sm hover:bg-[var(--primary-dark)] transition-colors"
                >
                  View
                </button>
                {(pinImage || tree.pin_location_img || tree.image_url) && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      // Use the correct image in this priority order
                      const imageToShow = pinImage || tree.pin_location_img || tree.image_url || '';
                      console.log("Opening image modal with:", imageToShow);
                      openImageModal(imageToShow);
                    }}
                    className="bg-[var(--primary-light)] text-white px-3 py-2 rounded text-sm hover:bg-[var(--primary)] transition-colors flex items-center justify-center"
                    aria-label="View full image"
                  >
                    <FaExpand />
                  </button>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(marker => marker !== null); // Remove null markers
  };

  // Add the class to the body for styling
  useEffect(() => {
    document.body.classList.add('explore-map-page');
    return () => {
      document.body.classList.remove('explore-map-page');
    };
  }, []);

  // Handle tree selection
  const handleTreeSelect = (tree: Tree) => {
    // Set the selected tree state
    setSelectedTree(tree);
    // Enable single tree view mode
    setShowOnlySelectedTree(true);
    
    try {
      // First try to get coordinates from the parseCoordinates function
      let coordinates = parseCoordinates(tree);
      
      // If no coordinates found, try to get them from parseAllCoordinates
      if (!coordinates) {
        const allCoords = parseAllCoordinates(tree);
        
        if (allCoords && allCoords.length > 0) {
          coordinates = allCoords[0];
        } else {
          console.warn(`No valid coordinates found for tree ${tree.id} (${tree.name})`);
          return; // Exit without changing map center
        }
      }
      
      // Extra validation to ensure coordinates are valid before using them
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2 || 
          typeof coordinates[0] !== 'number' || isNaN(coordinates[0]) ||
          typeof coordinates[1] !== 'number' || isNaN(coordinates[1])) {
        console.warn(`Invalid coordinates for tree ${tree.id} (${tree.name}):`, coordinates);
        return; // Exit without changing map center
      }
      
      // Extra validation for coordinate ranges
      if (coordinates[0] < -90 || coordinates[0] > 90 || 
          coordinates[1] < -180 || coordinates[1] > 180) {
        console.warn(`Coordinates out of range for tree ${tree.id} (${tree.name}):`, coordinates);
        return; // Exit without changing map center
      }
      
      // Create a proper Leaflet LatLng object
      try {
        const leafletCoords = L.latLng(coordinates[0], coordinates[1]);
        
        // Log the valid coordinates we're using
        console.log(`Centering map on tree ${tree.id} (${tree.name}) at:`, [leafletCoords.lat, leafletCoords.lng]);
        
        // Use a higher zoom level for better visibility
        const zoomLevel = 19; // Increased from 18 to 19 for closer zoom
        
        // Update state values - only set them once to avoid multiple renders
        // Use a small delay to ensure smooth UI transitions
        setTimeout(() => {
          setMapCenter([leafletCoords.lat, leafletCoords.lng]);
          setMapZoom(zoomLevel);
        }, 50);
        
        // Direct manipulation of the map if we have a reference - more responsive than state updates
        if (mapRef.current) {
          // Add a small delay to ensure UI has time to update
          setTimeout(() => {
            try {
              // Safely call flyTo with the proper Leaflet LatLng object
              mapRef.current?.flyTo(leafletCoords, zoomLevel, {
                duration: 0.8, // Faster animation to reduce lag
                easeLinearity: 0.25 // Add easeLinearity for smoother animation
              });
              
              // Force the map to invalidate size to handle any container size issues
              setTimeout(() => {
                mapRef.current?.invalidateSize({animate: true});
              }, 100);
            } catch (e) {
              console.error("Error with flyTo:", e);
              // Try simple setView as fallback
              try {
                mapRef.current?.setView(leafletCoords, zoomLevel);
              } catch (e2) {
                console.error("Error with setView:", e2);
              }
            }
          }, 10);
        }
      } catch (e) {
        console.error("Error creating LatLng object:", e);
      }
    } catch (e) {
      console.error("Error in handleTreeSelect:", e);
    }
  };

  // Add a function to reset the view to show all trees
  const handleShowAllTrees = () => {
    setShowOnlySelectedTree(false);
    setSelectedTree(null);
    setMapZoom(13);
    setMapCenter(defaultCenter);
    
    if (mapRef.current) {
      try {
        mapRef.current.flyTo(defaultCenter, 13, {
          duration: 1.0
        });
      } catch (e) {
        console.error("Error with flyTo:", e);
      }
    }
  };

  // Map tile URL based on theme
  const mapTileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Component to capture map reference
  const MapRef = () => {
    const map = useMap();
    
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    
    return null;
  };

  return (
    <div className="main-container">
      <div className="explore-map-page">
      <div className="top-row">
        <motion.div 
          className="map-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading map data...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          ) : (
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ 
                height: "100%", 
                width: "100%", 
                borderRadius: "inherit",
                zIndex: 5 
              }}
              zoomControl={false}
              attributionControl={false}
              className="map-z-fix"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={mapTileUrl}
              />
                <ZoomControl position="topright" />
              <MapRef />
              <RecenterMap center={mapCenter} zoom={mapZoom} />
              {showOnlySelectedTree && selectedTree 
                ? (renderMarkers(selectedTree) ?? null)  // Include null fallback for ReactNode
                : trees.map((tree) => renderMarkers(tree) ?? null)  // Map with proper typing
              }
            </MapContainer>
          )}
        </motion.div>

        <motion.div 
          className="list-container"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-4">
          <h2>Tree Catalogue</h2>
            
            {/* Add a button to show all trees when in single tree view mode */}
            {showOnlySelectedTree && (
              <motion.button
                className="px-3 py-1 bg-[var(--primary)] text-white rounded-md text-sm hover:bg-[var(--primary-dark)] transition-colors"
                onClick={handleShowAllTrees}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Show All Trees
              </motion.button>
            )}
          </div>
          
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            isFocused={isSearchFocused}
            onClear={() => setSearchQuery('')}
          />
          
          {searchQuery && (
            <motion.div
              className="search-results-count"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Found {filteredTrees.length} {filteredTrees.length === 1 ? 'tree' : 'trees'}
            </motion.div>
          )}
          
          <div className="tree-list">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading tree data...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
              </div>
            ) : filteredTrees.length === 0 ? (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p>No trees found matching your search.</p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>Clear Search</button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { 
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.05
                      }
                    }
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredTrees.map((tree) => (
                <motion.div
                  key={tree.id}
                  className={`tree-item ${selectedTree?.id === tree.id ? 'selected' : ''}`}
                  onClick={() => handleTreeSelect(tree)}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                >
                  <div className="tree-number">{tree.id}</div>
                  <div className="tree-name">
                    <h3>{typeof tree.name === 'string' ? highlightMatch(tree.name) : (tree.name || 'Unnamed Tree')}</h3>
                    <p className="scientific-name">{typeof tree.scientific_name === 'string' ? highlightMatch(tree.scientific_name) : (tree.scientific_name || 'Scientific name not available')}</p>
                  </div>
                </motion.div>
                  ))}
                </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedTree && (
          <motion.div 
            className="details-container"
              initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            ref={detailsRef}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Tree Details</h2>
              <motion.button
                className="close-button bg-[var(--primary-light)] hover:bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center"
                onClick={() => {
                  setSelectedTree(null);
                  setShowOnlySelectedTree(false);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </motion.button>
            </div>
            
            <div className="details-content">
              <div className="img-container rounded-lg overflow-hidden shadow-lg" style={{ height: '380px' }}>
                {selectedTree.image_url ? (
                  <div className="relative w-full h-full">
                  <Image 
                    src={selectedTree.image_url} 
                    alt={selectedTree.name || 'Tree image'} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="img-placeholder bg-gray-100 dark:bg-gray-800 h-full flex flex-col items-center justify-center">
                    <FaTree className="text-6xl opacity-40 mb-4 text-[var(--primary)]" />
                    <p className="text-gray-500 dark:text-gray-400">No image available</p>
                  </div>
                )}
              </div>
              
              <div className="info-container bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="scientific-name text-xl italic font-medium mb-4 text-[var(--primary)] border-b pb-2 border-gray-200 dark:border-gray-700">
                  {selectedTree.scientific_name || 'Scientific name not available'}
                </h3>
                
                <div className="info-grid">
                  <div className="info-item mb-4">
                    <h4 className="flex items-center text-lg font-medium mb-2">
                      <FaInfoCircle className="inline-block mr-2 text-[var(--primary-light)]" /> 
                      General Information
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedTree.gen_info || 'No information available'}
                    </p>
                  </div>
                  
                  <div className="info-item mb-4">
                    <h4 className="flex items-center text-lg font-medium mb-2">
                      <FaMapMarkedAlt className="inline-block mr-2 text-[var(--primary-light)]" /> 
                      Distribution
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedTree.distribution || 'No distribution information available'}
                    </p>
                  </div>
                  
                  <div className="info-item mb-4">
                    <h4 className="flex items-center text-lg font-medium mb-2">
                      <FaLeaf className="inline-block mr-2 text-[var(--primary-light)]" /> 
                      Family
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedTree.family_name || 'Family information not available'}
                    </p>
                  </div>
                  
                  <div className="info-item">
                    <h4 className="flex items-center text-lg font-medium mb-2">
                      <FaSeedling className="inline-block mr-2 text-[var(--primary-light)]" /> 
                      Status
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedTree.tree_status || 'Status not available'}
                    </p>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
      {/* Image Modal */}
      <ImageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={modalImage || ''}
        altText="Tree Image"
      />
    </div>
  );
}
