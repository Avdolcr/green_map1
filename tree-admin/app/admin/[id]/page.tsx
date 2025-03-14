'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Save, ArrowLeft, Loader, Camera, MapPin, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence, MotionConfig, useScroll, useSpring } from 'framer-motion';

// Remove direct Leaflet imports
// import 'leaflet/dist/leaflet.css';
// import { LatLngTuple, Icon } from 'leaflet';
// import { useMapEvents } from 'react-leaflet';

// Define the LatLngTuple type since we're not importing it
type LatLngTuple = [number, number];

// Dynamically import map components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const PopupComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Dynamically import Leaflet CSS
const LeafletCSS = dynamic(() => import('../LeafletCSS'), { ssr: false });

// Remove the custom icon creation that happens at module level
// Instead, we'll create it only on the client side when needed

interface Tree {
  name: string;
  family_name: string;
  scientific_name: string;
  location: string; // JSON array of pin objects with coord, icon, and image properties
  gen_info: string;
  distribution: string;
  image_url: string;
  // pin_icon and pin_location_img fields are no longer needed
  // as each pin now has its own icon and image
}

const parseCoordinates = (location: string | any): LatLngTuple[] => {
  try {
    if (!location) return [];
    
    // Handle direct object input (e.g. from MySQL JSON type column)
    let coordinates;
    
    if (typeof location === 'string') {
      // Try to parse the JSON string
      try {
        coordinates = JSON.parse(location);
      } catch (e) {
        console.error('Failed to parse location JSON:', e);
        return [];
      }
    } else {
      // Already an object, use directly
      coordinates = location;
    }
    
    if (!Array.isArray(coordinates)) return [];
    
    // Handle new format: array of pin objects with coord property
    if (coordinates.length > 0 && typeof coordinates[0] === 'object' && coordinates[0] !== null) {
      if ('coord' in coordinates[0]) {
        return coordinates
          .map(pin => {
            // Handle pin.coord as array [lat, lng]
            if (Array.isArray(pin.coord) && pin.coord.length === 2) {
              const [lat, lng] = pin.coord;
              if (typeof lat === 'number' && !isNaN(lat) && 
                  typeof lng === 'number' && !isNaN(lng)) {
                return [lat, lng] as LatLngTuple;
              }
            } 
            // Handle pin.coord as string "lat,lng"
            else if (typeof pin.coord === 'string') {
              const [lat, lng] = pin.coord.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                return [lat, lng] as LatLngTuple;
              }
            }
            return null;
          })
          .filter((coord): coord is LatLngTuple => coord !== null);
      }
    }
    
    // Handle old format: array of coordinate strings
    return coordinates
      .map((coord: string) => {
        if (typeof coord !== 'string') return null;
        const [lat, lng] = coord.split(',').map(Number);
        return !isNaN(lat) && !isNaN(lng) ? [lat, lng] as LatLngTuple : null;
      })
      .filter((coord): coord is LatLngTuple => coord !== null);
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return [];
  }
};

// Enhance the ProgressBar with a more subtle animation
const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transform origin-left z-50 pointer-events-none"
      style={{ scaleX }}
    />
  );
};

// Define a Pin type to correctly type the pin data
interface Pin {
  coord: [number, number];
  icon?: string;
  image?: string;
}

export default function AdminTreeForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false); // Add client-side detection

  const [formData, setFormData] = useState<Tree>({
    name: '',
    family_name: '',
    scientific_name: '',
    location: '',
    gen_info: '',
    distribution: '',
    image_url: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [mapIcon, setMapIcon] = useState<any>(null); // State for map icon

  // Add predefined tree icon options with more variety and better organization
  const treeIconOptions = [
    // Basic colored pins
    { 
      category: "Basic Colors",
      icons: [
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', label: 'Green' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', label: 'Blue' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', label: 'Red' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', label: 'Orange' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png', label: 'Yellow' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png', label: 'Violet' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png', label: 'Grey' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png', label: 'Gold' },
        { value: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png', label: 'Black' },
      ]
    },
    // Tree type icons
    {
      category: "Tree Types",
      icons: [
        { value: '/tree-icons/palm.png', label: 'Palm Tree' },
        { value: '/tree-icons/pine.png', label: 'Pine Tree' },
        { value: '/tree-icons/oak.png', label: 'Oak Tree' },
        { value: '/tree-icons/fruit.png', label: 'Fruit Tree' },
        { value: '/tree-icons/flower.png', label: 'Flowering Tree' },
      ]
    },
    // Philippines Trees
    {
      category: "Philippines Trees",
      icons: [
        { value: '/tree-icons/narra.png', label: 'Narra' },
        { value: '/tree-icons/mango.png', label: 'Mango' },
        { value: '/tree-icons/bamboo.png', label: 'Bamboo' },
        { value: '/tree-icons/coconut.png', label: 'Coconut' },
      ]
    }
  ];

  // Add state for the pin selection modal
  const [showPinModal, setShowPinModal] = useState(false);
  const [tempCoordinates, setTempCoordinates] = useState<[number, number] | null>(null);
  const [tempPinType, setTempPinType] = useState('');
  const [tempPinImage, setTempPinImage] = useState<File | null>(null);
  const [tempPinImagePreview, setTempPinImagePreview] = useState('');

  useEffect(() => {
    setMounted(true);
    setIsClient(true); // Set client-side flag
    
    // Load Leaflet icon on client side only
    const loadIcon = async () => {
      try {
        const L = await import('leaflet');
        const icon = new L.Icon({
          iconUrl: '/pin.png',
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        });
        setMapIcon(icon);
      } catch (err) {
        console.error('Failed to load Leaflet icon:', err);
      }
    };
    
    loadIcon();
    
    const controller = new AbortController();
    const fetchData = async () => {
      if (id && id !== 'new') {
        try {
          const response = await fetch(`/api/trees/${id}`, {
            signal: controller.signal,
          });
          if (!response.ok) throw new Error('Failed to fetch tree');
          const data = await response.json();
          setFormData(data);
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            toast.error('Failed to load tree data');
            router.push('/admin');
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchData();
    return () => {
      controller.abort();
      setMounted(false);
    };
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Create a copy of the form data to safely modify it
      const formDataToSubmit = { ...formData };
      
      // Ensure location data is properly stringified
      if (formDataToSubmit.location) {
        // If it's already a string, make sure it's valid JSON
        if (typeof formDataToSubmit.location === 'string') {
          try {
            // Just validate, don't reassign if it's already valid JSON
            JSON.parse(formDataToSubmit.location);
          } catch (e) {
            // Not valid JSON, could be a formatting issue, so stringify it
            formDataToSubmit.location = JSON.stringify(formDataToSubmit.location);
          }
        } else if (Array.isArray(formDataToSubmit.location) || typeof formDataToSubmit.location === 'object') {
          // It's an object/array, stringify it for submission
          formDataToSubmit.location = JSON.stringify(formDataToSubmit.location);
        }
      }
      
      const method = id === 'new' ? 'POST' : 'PUT';
      const url = id === 'new' ? '/api/trees' : `/api/trees/${id}`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToSubmit),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }
      
      toast.success(id === 'new' ? 'Tree added!' : 'Tree updated!');
      router.push('/admin');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Modify the handleMapClick function to store the clicked position for later use
  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng;
    // Store temporary coordinates
    setTempCoordinates([lat, lng]);
    // Show the pin selection modal
    setShowPinModal(true);
  };

  // Function to add the pin with the selected type and image
  const addPinWithDetails = async () => {
    if (!tempCoordinates) return;
    
    const [lat, lng] = tempCoordinates;
    
    // Create a new pin object with coordinates, icon, and potentially image
    const newPin: Pin = {
      coord: [lat, lng],
      icon: tempPinType
    };
    
    // If image was uploaded, handle it first to get the URL
    if (tempPinImage) {
        try {
          const formData = new FormData();
          formData.append('file', tempPinImage);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload image');
          }
          
          const data = await response.json();
        // Add the image URL to the pin object
        newPin.image = data.url;
          
          toast.success('Pin image uploaded successfully!');
        } catch (error) {
          toast.error('Failed to upload pin image');
          console.error(error);
        }
    }
    
    // Update form data with new pin
    const currentPins = (() => {
      try {
        // Handle both string and object inputs for location
        let locationData = formData.location;
        
        // Ensure location data is not empty or invalid
        if (!locationData) {
          console.log('Empty location data, returning empty array');
          return [] as Pin[];
        }
        
        if (typeof locationData === 'string') {
          // Make sure the string is not empty before parsing
          if (!locationData.trim()) {
            console.log('Empty location string, returning empty array');
            return [] as Pin[];
          }
          
          try {
            // Try to parse the JSON string
            locationData = JSON.parse(locationData);
            console.log('Successfully parsed location data:', locationData);
          } catch (e) {
            console.error('Failed to parse location data:', e);
            return [] as Pin[];
          }
        }
        
        if (!Array.isArray(locationData)) {
          console.log('Location data is not an array, returning empty array');
          return [] as Pin[];
        }
        
        // If old format (strings), convert to objects
        if (locationData.length > 0 && typeof locationData[0] === 'string') {
          return locationData.map(coordStr => {
            const [lat, lng] = coordStr.split(',').map(Number);
            return { coord: [lat, lng] as [number, number] } as Pin;
          });
        }
        
        // Already in new format or empty array
        return locationData as Pin[];
      } catch (e) {
        console.error('Error parsing location data:', e);
        return [] as Pin[];
      }
    })();
    
    // Add the new pin to the array
    const updatedPins = [...currentPins, newPin];
    
    // Ensure we're setting a string for the location field
    const updatedLocationString = JSON.stringify(updatedPins);
    console.log('Updated location string:', updatedLocationString);
    
    // Update the form data
      setFormData(prev => ({
        ...prev,
      location: updatedLocationString
    }));
    
    // Reset temporary states
    setTempCoordinates(null);
    setTempPinType('');
    setTempPinImage(null);
    setTempPinImagePreview('');
    setShowPinModal(false);
    
    toast.success('Pin added successfully!');
  };

  // Create a simple client-side only TreeMap component
  const TreeMap = () => {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
      setMounted(true);
    }, []);
    
    if (!mounted) {
      return (
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg h-full flex items-center justify-center">
          <div className="text-center text-text-secondary">
            <div className="mb-1 opacity-40">
              <MapPin className="w-6 h-6 mx-auto" />
                      </div>
            <span className="text-xs">Loading map...</span>
                    </div>
                  </div>
      );
    }
    
    // Dynamically import map components
    const Map = dynamic(
      () => import('./map-components').then(mod => mod.TreeMapClient),
      { ssr: false }
    );
    
    return <Map formData={formData} setFormData={setFormData} handleMapClick={handleMapClick} />;
  };
  
  // Update the FallbackLocationInput component
  const FallbackLocationInput = () => {
    const [manualCoords, setManualCoords] = useState("");
    const [error, setError] = useState("");
    
    const handleAdd = () => {
      try {
        // Split by comma or spaces and filter out empty parts
        const parts = manualCoords
          .split(/[,\s]+/)
          .map(part => part.trim())
          .filter(part => part);
        
        // Ensure we have exactly 2 parts
      if (parts.length !== 2) {
          setError("Please enter valid coordinates with latitude and longitude");
        return;
      }
      
        // Parse as numbers
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        // Check if the parsed values are valid numbers
      if (isNaN(lat) || isNaN(lng)) {
          setError("Coordinates must be valid numbers");
        return;
      }
      
        // Validate range (basic check)
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setError("Latitude must be between -90 and 90, and longitude between -180 and 180");
          return;
        }
        
        // Add coordinates to form data as a new pin object
        const newPin: Pin = { coord: [lat, lng] };
        
        const currentPins = (() => {
          try {
            const locationData = formData.location ? JSON.parse(formData.location) : [];
            // Handle both old and new formats
            if (Array.isArray(locationData)) {
              if (locationData.length === 0) return [];
              
              // If old format (strings), convert to objects
              if (typeof locationData[0] === 'string') {
                return locationData.map(coordStr => {
                  const [lat, lng] = coordStr.split(',').map(Number);
                  return { coord: [lat, lng] as [number, number] };
                });
              }
              
              // Already in new format
              return locationData;
            }
            return [];
          } catch (e) {
            console.error('Error parsing location data:', e);
            return [];
          }
        })();
        
        const updatedPins = [...currentPins, newPin];
      
      setFormData(prev => ({
        ...prev,
          location: JSON.stringify(updatedPins)
        }));
        
        // Reset form and error
        setManualCoords("");
        setError("");
        
        toast.success("Location added successfully");
      } catch (err) {
        console.error(err);
        setError("Failed to add coordinates. Please check the format.");
      }
    };
    
    // Function to parse coordinates maintaining pin-specific properties
    const parsePinData = (location: string): (Pin & { id: number })[] => {
      try {
        if (!location) return [];
        
        const locationData = JSON.parse(location);
        
        // Handle old format (array of strings)
        if (Array.isArray(locationData) && locationData.length > 0) {
          if (typeof locationData[0] === 'string') {
            return locationData.map((coordStr, index) => {
              const [lat, lng] = coordStr.split(',').map(Number);
              return {
                id: index,
                coord: [lat, lng] as [number, number]
              };
            });
          }
          
          // Handle new format (array of objects)
          return locationData.map((item, index) => {
            // Get coordinates correctly typed
            let coord: [number, number];
            if (Array.isArray(item.coord) && item.coord.length === 2) {
              coord = item.coord as [number, number];
            } else if (typeof item.coord === 'string') {
              const [lat, lng] = item.coord.split(',').map(Number);
              coord = [lat, lng];
            } else {
              coord = [0, 0]; // Default
            }
            
            return {
              id: index,
              coord,
              icon: item.icon,
              image: item.image
            };
          });
        }
        
        return [];
      } catch (e) {
        console.error('Error parsing pin data:', e);
        return [];
      }
    };
    
    // Get pin data
    const pinData = parsePinData(formData.location || '[]');
    
    return (
      <div>
        <div className="text-xs text-text-secondary mb-2">
          Manual coordinate entry: Latitude, Longitude (e.g. 14.5995, 120.9842)
        </div>
        <div className="flex gap-2 items-center">
            <input
              type="text"
            value={manualCoords}
            onChange={(e) => {
              setManualCoords(e.target.value);
              setError(""); // Clear error when typing
            }}
            placeholder="e.g. 14.5995, 120.9842"
            className="form-input flex-1"
            />
            <button
            type="button"
            onClick={handleAdd}
            className="secondary-button"
            >
              Add
            </button>
          </div>
        {error && (
          <div className="text-xs text-red-500 mt-1">{error}</div>
        )}
        
        <div className="mt-3">
          <h4 className="text-xs font-medium mb-1">Current Coordinates:</h4>
          <div className="text-xs">
            {pinData.length === 0 ? (
              <span className="text-text-secondary">No coordinates added yet</span>
            ) : (
              pinData.map((pin, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <span className="text-text-secondary">
                    {idx + 1}. {Array.isArray(pin.coord) ? 
                      `${pin.coord[0].toFixed(6)}, ${pin.coord[1].toFixed(6)}` : 
                      pin.coord}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedPins = pinData.filter((_, i) => i !== idx);
                      setFormData(prev => ({
                        ...prev,
                        location: JSON.stringify(updatedPins)
                      }));
                    }}
                    className="text-red-500 text-xs hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            </div>
          </div>
      </div>
    );
  };

  // Add this function to handle image uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setImageUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }
        const { url } = await response.json();
        setFormData((prev) => ({ ...prev, image_url: url }));
      } catch (error: any) {
        toast.error(error.message || 'Image upload failed');
      } finally {
        setImageUploading(false);
      }
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-opacity-20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-text-secondary text-sm">Loading tree data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <ProgressBar />
      <LeafletCSS />
      
      <div className="min-h-screen py-6 px-4 sm:px-6 bg-background">
        <motion.div 
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
            <div className="mb-6">
              <motion.button
                onClick={() => router.push('/admin')}
                className="secondary-button flex items-center text-sm px-3 py-1.5"
                whileHover={{ x: -3, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Dashboard
              </motion.button>
            </div>
            
          <motion.div 
            className="card p-6 sm:p-8 shadow-sm sm:shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <motion.h1 
              className="text-2xl font-bold text-text-primary mb-6 flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              {id === 'new' ? 'Add New Tree' : 'Edit Tree'}
            </motion.h1>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column - Basic Info */}
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Tree Name*
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input w-full transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="E.g., Narra, Mango Tree"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="scientific_name" className="block text-sm font-medium mb-1">
                        Scientific Name*
                      </label>
                      <input
                        id="scientific_name"
                        type="text"
                        required
                        value={formData.scientific_name}
                        onChange={(e) => setFormData({...formData, scientific_name: e.target.value})}
                        className="form-input w-full transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="E.g., Pterocarpus indicus"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="family_name" className="block text-sm font-medium mb-1">
                        Family
                      </label>
                      <input
                        id="family_name"
                        type="text"
                        value={formData.family_name}
                        onChange={(e) => setFormData({...formData, family_name: e.target.value})}
                        className="form-input w-full transition-all focus:ring-2 focus:ring-primary/20"
                        placeholder="E.g., Fabaceae"
                      />
                    </div>
                          
                    <div>
                      <label htmlFor="image_url" className="block text-sm font-medium mb-1">
                        Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="image_url"
                          type="text"
                          value={formData.image_url}
                          onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                          className="form-input w-full transition-all focus:ring-2 focus:ring-primary/20"
                          placeholder="Image URL or upload"
                        />
                        <motion.label 
                          className="secondary-button shrink-0 flex items-center justify-center cursor-pointer"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e)}
                          />
                        </motion.label>
                      </div>
                      {imageUploading && (
                        <div className="mt-2 flex items-center text-text-secondary text-xs">
                          <Loader className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Uploading image...
                        </div>
                      )}
                      {formData.image_url && (
                        <motion.div 
                          className="mt-2 rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative h-32"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img
                            src={formData.image_url}
                            alt="Tree preview" 
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Right column - Map and Location */}
                  <motion.div 
                    className="space-y-5"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Location
                      </label>
                      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden mb-2 h-[250px] shadow-inner">
                        <TreeMap />
                      </div>
                      <p className="text-xs text-text-secondary mb-2">
                        Click on the map to add location markers. Right-click a marker to remove it.
                      </p>
                      <FallbackLocationInput />
                    </div>
                  </motion.div>
                </div>
                      
                {/* Full width - Description Fields */}
                <motion.div 
                  className="space-y-5 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <div>
                    <label htmlFor="gen_info" className="block text-sm font-medium mb-1">
                      General Information
                    </label>
                    <textarea
                      id="gen_info"
                      value={formData.gen_info}
                      onChange={(e) => setFormData({...formData, gen_info: e.target.value})}
                      rows={4}
                      className="form-input w-full transition-all focus:ring-2 focus:ring-primary/20"
                      placeholder="Provide general information about this tree species"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="distribution" className="block text-sm font-medium mb-1">
                      Distribution
                    </label>
                    <textarea
                      id="distribution"
                      value={formData.distribution}
                      onChange={(e) => setFormData({...formData, distribution: e.target.value})}
                      rows={3}
                      className="form-input w-full transition-all focus:ring-2 focus:ring-primary/20"
                      placeholder="Describe the geographical distribution of this tree"
                    />
                  </div>
                </motion.div>
                        
                <motion.div 
                  className="pt-4 flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="primary-button flex items-center"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        {id === 'new' ? 'Adding...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {id === 'new' ? 'Add Tree' : 'Update Tree'}
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
      
      {/* Pin Selection Modal */}
      {showPinModal && (
        <AnimatePresence>
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="card w-full max-w-md mx-4 p-5 relative"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
            >
              <h3 className="text-lg font-bold mb-1">Pin Details</h3>
              <p className="text-text-secondary text-sm mb-4">
                Customize this specific pin's appearance and add an optional photo for this location.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Pin Style for this Location</label>
                <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {treeIconOptions.flatMap(category => 
                    category.icons.map(icon => (
                      <motion.button
                        key={icon.value}
                        type="button"
                        onClick={() => setTempPinType(icon.value)}
                        className={`p-2 border rounded-md flex flex-col items-center justify-center hover:border-primary transition-colors
                          ${tempPinType === icon.value ? 'border-primary bg-primary/5' : 'border-neutral-200 dark:border-neutral-700'}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <img src={icon.value} alt={icon.label} className="h-6 w-6 object-contain" />
                        <span className="text-xs mt-1 truncate w-full text-center">{icon.label}</span>
                      </motion.button>
                    ))
                  )}
                </div>
              </div>
                      
              {/* Optional: Custom image upload for this pin location */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Photo for this Location (Optional)</label>
                <p className="text-text-secondary text-xs mb-2">
                  Each pin can have its own unique photo to show details about this specific location.
                </p>
                <div className="flex items-center gap-2">
                  <motion.label 
                    className="secondary-button flex items-center justify-center cursor-pointer py-1.5 px-3 text-sm"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Camera className="w-3.5 h-3.5 mr-1" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setTempPinImage(e.target.files[0]);
                          setTempPinImagePreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                    />
                  </motion.label>
                  {tempPinImagePreview && (
                    <motion.div 
                      className="h-14 w-14 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.4 }}
                    >
                      <img
                        src={tempPinImagePreview}
                        alt="Location preview"
                        className="h-full w-full object-cover"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            
              {/* Pin location coordinates */}
              <div className="mb-4 p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-sm">
                <p className="text-text-secondary">
                  <span className="font-medium">Pin Location:</span> {tempCoordinates ? `${tempCoordinates[0].toFixed(6)}, ${tempCoordinates[1].toFixed(6)}` : ''}
                </p>
              </div>
            
              <div className="flex justify-end gap-2 mt-6">
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setTempCoordinates(null);
                    setTempPinType('');
                    setTempPinImage(null);
                    setTempPinImagePreview('');
                  }}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={addPinWithDetails}
                  disabled={!tempPinType}
                  className="primary-button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Add Pin
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
