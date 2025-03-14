'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Edit, Trash2, Plus, TreePine, Search, Image, Globe, Users, SortAsc, SortDesc, Filter, RefreshCw, ChevronDown, MessageSquare, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import React from 'react';

// Dynamically import AdminTools to prevent possible SSR/import issues
const AdminTools = dynamic(() => import('./debug-buttons'), {
  ssr: false,
  loading: () => (
    <div className="mb-6">
      <div className="card border-2 border-neutral-200 dark:border-neutral-800 shadow-sm p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
});

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
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Dynamically import Leaflet CSS
const LeafletCSS = dynamic(() => import('./LeafletCSS'), { ssr: false });

// Default fallback coordinates
const DEFAULT_COORDINATES: [number, number] = [16.5324, 120.3929]; // La Union, Naguilian

// Add an error boundary component for the map
class MapErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode, fallback: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Map error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Create a separate Map component to properly handle hooks
const TreeMap = ({ coordinates, treeId }: { coordinates: [number, number][], treeId: number }) => {
  // Only render on client side
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Validate coordinates
  const hasValidCoordinates = 
    isClient && 
    coordinates && 
    coordinates.length > 0 && 
    coordinates[0] && 
    coordinates[0].length === 2 &&
    typeof coordinates[0][0] === 'number' && !isNaN(coordinates[0][0]) &&
    typeof coordinates[0][1] === 'number' && !isNaN(coordinates[0][1]);
  
  // Skip rendering if no valid coordinates or not on client
  if (!hasValidCoordinates) {
    return (
      <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <div className="mb-1 opacity-40">
            <Globe className="w-6 h-6 mx-auto" />
          </div>
          <span className="text-xs">No location data</span>
        </div>
      </div>
    );
  }
  
  // Generate a unique ID for this map instance
  const mapId = `map-${treeId}-${Math.floor(Math.random() * 1000000)}`;
  
  // Default coordinates fallback if somehow validation passes but coordinates are still invalid
  const center = (
    Array.isArray(coordinates[0]) && 
    coordinates[0].length === 2 && 
    typeof coordinates[0][0] === 'number' && !isNaN(coordinates[0][0]) &&
    typeof coordinates[0][1] === 'number' && !isNaN(coordinates[0][1])
  ) ? coordinates[0] : DEFAULT_COORDINATES;
  
  const mapFallback = (
    <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
      <div className="text-center text-text-secondary">
        <div className="mb-1 opacity-40">
          <Globe className="w-6 h-6 mx-auto" />
        </div>
        <span className="text-xs">Error loading map</span>
      </div>
    </div>
  );
  
  return (
    <MapErrorBoundary fallback={mapFallback}>
      <LeafletCSS />
      <div className="relative w-full h-36 rounded-lg overflow-hidden">
        <MapContainer
          key={mapId}
          center={center}
          zoom={16}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={true}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {coordinates.map((coord, index) => (
            Array.isArray(coord) && 
            coord.length === 2 && 
            typeof coord[0] === 'number' && !isNaN(coord[0]) &&
            typeof coord[1] === 'number' && !isNaN(coord[1]) ? (
              <Marker key={`marker-${treeId}-${index}`} position={coord}>
                <Popup>Tree location</Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </MapErrorBoundary>
  );
};

interface Tree {
  id: number;
  name: string;
  family_name: string;
  scientific_name: string;
  location: string; // JSON array of coordinates
  image_url: string;
  gen_info?: string;
  created_at?: string; // Add this field for sorting
}

// Helper function to ensure tree location is properly formatted
const safeTree = (tree: any): Tree => {
  const result = { ...tree };
  
  // Ensure location is always a string
  if (result.location) {
    if (typeof result.location === 'object') {
      // Location is already an object, stringify it
      result.location = JSON.stringify(result.location);
    } else if (typeof result.location === 'string') {
      // Ensure it's valid JSON string
      try {
        JSON.parse(result.location);
      } catch (e) {
        // Not valid JSON string, reset to empty array
        result.location = '[]';
      }
    } else {
      // Unknown type, reset to empty
      result.location = '[]';
    }
  } else {
    // No location, set to empty array
    result.location = '[]';
  }
  
  return result as Tree;
};

// Animated counter component 
function AnimatedCounter({ value, className }: { value: number, className?: string }) {
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const displayValue = useMotionValue(0);
  const roundedValue = useTransform(displayValue, (val) => Math.round(val));
  
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);
  
  useEffect(() => {
    const unsubscribe = springValue.onChange((val) => {
      displayValue.set(val);
    });
    
    return () => unsubscribe();
  }, [springValue, displayValue]);
  
  return (
    <motion.span className={className}>
      {roundedValue}
    </motion.span>
  );
}

export default function AdminPage() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [sortField, setSortField] = useState<'name' | 'scientific_name' | 'family_name' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalPinCount, setTotalPinCount] = useState(0);
  const [isChatHistoryHovered, setIsChatHistoryHovered] = useState(false);
  
  useEffect(() => {
    fetchTrees();
  }, []);
  
  // Calculate total pins whenever trees change
  useEffect(() => {
    calculateTotalPins();
  }, [trees]);
  
  // Function to calculate the total number of pins across all trees
  const calculateTotalPins = () => {
    let pinCount = 0;
    
    trees.forEach(tree => {
      try {
        const coords = parseCoordinates(tree.location || '[]');
        pinCount += coords.length;
      } catch (error) {
        console.error('Error counting pins for tree', tree.id, error);
      }
    });
    
    setTotalPinCount(pinCount);
  };

  const fetchTrees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trees');
      const data = await response.json();
      
      if (response.ok) {
        setTrees(data.map(safeTree));
      } else {
        toast.error('Failed to load trees');
      }
    } catch (error) {
      console.error('Error fetching trees:', error);
      toast.error('An error occurred while fetching trees');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTrees = async () => {
    try {
      setIsRefreshing(true);
      await fetchTrees();
      toast.success('Tree inventory refreshed!');
    } catch (error) {
      console.error('Error refreshing trees:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteTree = async (id: number) => {
    if (confirm('Are you sure you want to delete this tree?')) {
      try {
        const response = await fetch(`/api/trees/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Tree deleted successfully');
          // Filter out the deleted tree instead of refetching for better performance
          setTrees(prev => prev.filter(tree => tree.id !== id));
        } else {
          toast.error('Failed to delete tree');
        }
      } catch (error) {
        console.error('Error deleting tree:', error);
        toast.error('An error occurred while deleting the tree');
      }
    }
  };

  const parseCoordinates = (location: string | any): [number, number][] => {
    // If it's null or undefined, return empty array
    if (!location) {
      return [];
    }
    
    try {
      // If location is already an object (e.g., from MySQL JSON type), use it directly
      let parsed = location;
      
      // If it's a string, try to parse it
      if (typeof location === 'string') {
        // Handle empty strings
        const trimmedLocation = location.trim();
        if (!trimmedLocation || trimmedLocation === '[]' || trimmedLocation === '{}') {
          return [];
        }
        
        try {
          parsed = JSON.parse(trimmedLocation);
        } catch (e) {
          console.error('Failed to parse location JSON:', e);
          return [];
        }
      }
      
      // Handle new format: array of pin objects with coord property
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        // Check if it's the new format with pin objects that have a coord property
        if ('coord' in parsed[0]) {
          return parsed
            .map(pin => {
              // Handle pin.coord as array [lat, lng]
              if (Array.isArray(pin.coord) && pin.coord.length === 2) {
                const [lat, lng] = pin.coord;
                if (typeof lat === 'number' && !isNaN(lat) && 
                    typeof lng === 'number' && !isNaN(lng)) {
                  return [lat, lng];
                }
              } 
              // Handle pin.coord as string "lat,lng"
              else if (typeof pin.coord === 'string') {
                const [lat, lng] = pin.coord.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                  return [lat, lng];
                }
              }
              return null;
            })
            .filter((coord): coord is [number, number] => coord !== null);
        }
      }
      
      // Handle old format: array of coordinate strings
      if (Array.isArray(parsed)) {
        // Handle array of strings like ["16.123,120.456", "16.789,120.987"]
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          return parsed
            .map(coordStr => {
              if (typeof coordStr !== 'string') return null;
              const [lat, lng] = coordStr.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                return [lat, lng];
              }
              return null;
          })
          .filter((coord): coord is [number, number] => coord !== null);
        }
        
        // Handle array of number arrays like [[16.123, 120.456], [16.789, 120.987]]
        return parsed.filter(coord => 
          Array.isArray(coord) && 
          coord.length === 2 && 
          typeof coord[0] === 'number' && !isNaN(coord[0]) && 
          typeof coord[1] === 'number' && !isNaN(coord[1])
        );
      }
      
      // Handle case where coordinates might be stored as a single pair instead of array of pairs
      if (typeof parsed === 'object' && parsed !== null && 
          'lat' in parsed && 'lng' in parsed && 
          typeof parsed.lat === 'number' && !isNaN(parsed.lat) && 
          typeof parsed.lng === 'number' && !isNaN(parsed.lng)) {
        return [[parsed.lat, parsed.lng]];
      }
      
      console.error('Location data is not in expected format:', parsed);
      return [];
    } catch (e) {
      console.error('Failed to parse coordinates:', e, 'Raw location:', location);
      return [];
    }
  };

  // Add sort function
  const sortTrees = (a: Tree, b: Tree) => {
    const fieldA = sortField === 'created_at' 
      ? new Date(a[sortField] || '').getTime() 
      : (a[sortField] || '').toLowerCase();
    
    const fieldB = sortField === 'created_at' 
      ? new Date(b[sortField] || '').getTime() 
      : (b[sortField] || '').toLowerCase();
    
    const compareResult = fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
    return sortDirection === 'asc' ? compareResult : -compareResult;
  };
  
  // Filter and sort trees
  const filteredTrees = trees
    .filter(tree => 
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.family_name?.toLowerCase().includes(searchTerm.toLowerCase() || '')
    )
    .sort(sortTrees);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTrees.length / itemsPerPage);
  const paginatedTrees = filteredTrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle sort toggle
  const handleSortToggle = (field: 'name' | 'scientific_name' | 'family_name' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Define page change handler
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Smooth scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Define transitions at component level to reuse
  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  };
  
  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;
    
    const range = 2; // Show 2 pages before and after current page
    let pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate range around current page
      const startPage = Math.max(2, currentPage - range);
      const endPage = Math.min(totalPages - 1, currentPage + range);
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add pages in range
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return (
      <motion.div 
        className="flex justify-center mt-8 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center rounded-md shadow overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
          <motion.button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 text-sm border-r border-neutral-200 dark:border-neutral-700 flex items-center gap-1 transition-colors
              ${currentPage === 1 
                ? 'text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed' 
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary'}`}
            whileHover={currentPage !== 1 ? { scale: 1.03 } : {}}
            whileTap={currentPage !== 1 ? { scale: 0.97 } : {}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
            <span>Previous</span>
          </motion.button>
          
          <div className="flex items-center">
            {pages.map((page, index) => (
              typeof page === 'number' ? (
                <motion.button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`relative w-10 h-9 text-sm flex items-center justify-center border-r border-neutral-200 dark:border-neutral-700 transition-colors
                    ${currentPage === page 
                      ? 'text-white font-medium' 
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary'}`}
                  whileHover={currentPage !== page ? { scale: 1.1 } : {}}
                  whileTap={currentPage !== page ? { scale: 0.9 } : {}}
                >
                  {currentPage === page && (
                    <motion.div 
                      className="absolute inset-0 bg-primary rounded-sm z-0"
                      layoutId="activePageBg"
                      transition={{ duration: 0.2, type: "spring" }}
                    />
                  )}
                  <span className="relative z-10">{page}</span>
                </motion.button>
              ) : (
                <span 
                  key={index} 
                  className="w-8 h-9 flex items-center justify-center text-sm border-r border-neutral-200 dark:border-neutral-700 text-neutral-400"
                >
                  ⋯
                </span>
              )
            ))}
          </div>
          
          <motion.button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 text-sm flex items-center gap-1 transition-colors
              ${currentPage === totalPages 
                ? 'text-neutral-400 dark:text-neutral-600 bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed' 
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary'}`}
            whileHover={currentPage !== totalPages ? { scale: 1.03 } : {}}
            whileTap={currentPage !== totalPages ? { scale: 0.97 } : {}}
          >
            <span>Next</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06.02z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>
        
        {totalPages > 5 && (
          <div className="mt-2 text-xs text-text-secondary text-center">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </motion.div>
    );
  };

  // Stats summary component
  const StatsSummary = () => {
    // Calculate the number of visible pins in the filtered trees
    const visiblePinsCount = useMemo(() => {
      let count = 0;
      filteredTrees.forEach(tree => {
        try {
          const coords = parseCoordinates(tree.location || '[]');
          count += coords.length;
        } catch (error) {
          console.error('Error counting pins for filtered tree', tree.id, error);
        }
      });
      return count;
    }, [filteredTrees]);
    
    // Calculate unique categories (families) count
    const uniqueCategories = useMemo(() => {
      const categories = trees.map(tree => tree.family_name);
      return [...new Set(categories)].length;
    }, [trees]);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-5"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-neutral-100 dark:border-neutral-800 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="card p-4 flex flex-col overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white dark:from-emerald-900/20 dark:via-emerald-900/10 dark:to-neutral-900/80 border-emerald-100 dark:border-emerald-900/30 rounded-lg shadow-sm relative"
            >
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mb-1 flex items-center">
                <div className="bg-white dark:bg-black/20 p-1 rounded-md shadow-sm mr-1.5">
                  <TreePine className="w-3 h-3 text-emerald-500" />
                </div>
                Total Trees
              </span>
              <div className="flex items-baseline">
                <AnimatedCounter 
                  value={totalPinCount} 
                  className="text-2xl font-bold text-emerald-700 dark:text-emerald-400"
                />
                <span className="text-xs ml-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  trees
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 text-emerald-100 dark:text-emerald-900/20">
                <TreePine className="w-full h-full" />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="card p-4 flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-blue-50/70 to-white dark:from-blue-900/20 dark:via-blue-900/10 dark:to-neutral-900/80 border-blue-100 dark:border-blue-900/30 rounded-lg shadow-sm relative"
            >
              <span className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center">
                <div className="bg-white dark:bg-black/20 p-1 rounded-md shadow-sm mr-1.5">
                  <Search className="w-3 h-3 text-blue-500" />
                </div>
                Records
              </span>
              <div className="flex items-baseline">
                <AnimatedCounter 
                  value={trees.length} 
                  className="text-2xl font-bold text-blue-700 dark:text-blue-400"
                />
                <span className="text-xs ml-1.5 text-blue-600 dark:text-blue-400 font-medium">
                  entries
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 text-blue-100 dark:text-blue-900/20">
                <Search className="w-full h-full" />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="card p-4 flex flex-col overflow-hidden bg-gradient-to-br from-purple-50 via-purple-50/70 to-white dark:from-purple-900/20 dark:via-purple-900/10 dark:to-neutral-900/80 border-purple-100 dark:border-purple-900/30 rounded-lg shadow-sm relative"
            >
              <span className="text-xs font-medium text-purple-800 dark:text-purple-300 mb-1 flex items-center">
                <div className="bg-white dark:bg-black/20 p-1 rounded-md shadow-sm mr-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-purple-500">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                Visible Trees
              </span>
              <div className="flex items-baseline">
                <AnimatedCounter 
                  value={visiblePinsCount} 
                  className="text-2xl font-bold text-purple-700 dark:text-purple-400"
                />
                <span className="text-xs ml-1.5 text-purple-600 dark:text-purple-400 font-medium">
                  visible
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 text-purple-100 dark:text-purple-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="card p-4 flex flex-col overflow-hidden bg-gradient-to-br from-amber-50 via-amber-50/70 to-white dark:from-amber-900/20 dark:via-amber-900/10 dark:to-neutral-900/80 border-amber-100 dark:border-amber-900/30 rounded-lg shadow-sm relative"
            >
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1 flex items-center">
                <div className="bg-white dark:bg-black/20 p-1 rounded-md shadow-sm mr-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-amber-500">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                Categories
              </span>
              <div className="flex items-baseline">
                <AnimatedCounter 
                  value={uniqueCategories} 
                  className="text-2xl font-bold text-amber-700 dark:text-amber-400"
                />
                <span className="text-xs ml-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  families
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 text-amber-100 dark:text-amber-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Sort button component
  const SortButton = ({ field, label }: { field: 'name' | 'scientific_name' | 'family_name' | 'created_at', label: string }) => {
    return (
      <motion.button 
        onClick={() => handleSortToggle(field)}
        className={`px-2 py-1.5 text-xs rounded-md flex items-center gap-1 transition-all
          ${sortField === field 
            ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
            : 'text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {label}
        {sortField === field && (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: sortDirection === 'asc' ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            {sortDirection === 'asc' 
              ? <SortAsc className="w-3 h-3" /> 
              : <SortDesc className="w-3 h-3" />}
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen py-5 px-3 sm:px-5 lg:px-6 bg-background pattern-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-3 md:mb-0"
          >
            <h1 className="text-xl font-bold text-text-primary">
              <span className="flex items-center">
                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-800/40 dark:to-teal-800/40 p-1.5 rounded-md mr-2 shadow-sm">
                  <TreePine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 bg-clip-text text-transparent">
                  Tree Inventory Management
                </span>
              </span>
            </h1>
            <p className="mt-1 text-text-secondary text-xs">
              View, edit, and manage your urban forest inventory
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Search trees..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="form-input pl-8 h-9 text-sm py-1.5 w-full"
              />
            </div>
          </motion.div>
        </div>
        
        {/* Add stats summary */}
        <StatsSummary />
        
        {/* Add AdminTools component */}
        <AdminTools />
        
        {/* Add sort controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between bg-white dark:bg-neutral-900 p-3 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-secondary bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md shadow-sm">Sort by:</span>
            <SortButton field="name" label="Name" />
            <SortButton field="scientific_name" label="Scientific Name" />
            <SortButton field="family_name" label="Family" />
            <SortButton field="created_at" label="Date Added" />
          </div>
          
          <button
            className="secondary-button flex items-center text-xs px-3 py-1.5 ml-auto mt-2 sm:mt-0 bg-gradient-to-br from-cyan-50 to-cyan-50/50 dark:from-cyan-900/20 dark:to-cyan-900/10 text-cyan-700 dark:text-cyan-400 hover:from-cyan-100 hover:to-cyan-100/50 dark:hover:from-cyan-900/30 dark:hover:to-cyan-900/20 transition-colors border border-cyan-200 dark:border-cyan-900/50"
            onClick={refreshTrees}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                {...fadeIn}
                className="flex justify-center py-8"
              >
                <div className="flex flex-col items-center">
                  <div className="relative w-12 h-12">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-opacity-20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                  </div>
                  <p className="text-text-secondary text-xs mt-4">Loading tree inventory...</p>
                </div>
              </motion.div>
            ) : filteredTrees.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800"
              >
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <TreePine className="w-10 h-10 text-text-secondary opacity-40" />
                </div>
                <h3 className="text-base font-medium text-text-primary mb-2">
                  {searchTerm ? 'No trees match your search' : 'No trees found'}
                </h3>
                <p className="text-text-secondary text-xs mb-5 max-w-md mx-auto">
                  {searchTerm 
                    ? 'Try a different search term or clear the search'
                    : 'Start by adding a new tree to your inventory'}
                </p>
                <Link 
                  href="/admin/new_tree"
                  className="primary-button inline-flex items-center text-xs px-3 py-1.5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add New Tree</span>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                {...fadeIn}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedTrees.map((tree) => {
                    const coordinates = parseCoordinates(tree.location || '[]');
                    const hasValidLocation = coordinates && coordinates.length > 0;
                    
                    return (
                      <motion.div 
                        key={tree.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ 
                          y: -3,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                          transition: { duration: 0.2 }
                        }}
                        className="card card-hover overflow-hidden p-0 border-none"
                      >
                        <div className="relative rounded-t-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                          {tree.image_url ? (
                            <img 
                              src={tree.image_url}
                              alt={tree.name}
                              className="w-full h-40 object-cover transition-transform duration-500 hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-40 flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 text-text-secondary">
                              <TreePine className="w-12 h-12 opacity-30" />
                              <span className="sr-only">No image available</span>
                            </div>
                          )}
                          
                          {/* Add a tag/badge for tree family */}
                          {tree.family_name && (
                            <div className="absolute top-2 right-2">
                              <div className="badge badge-primary">
                                {tree.family_name}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h2 className="text-base font-bold text-text-primary mb-0.5 truncate">{tree.name || 'Unnamed Tree'}</h2>
                          <p className="text-text-secondary italic text-xs mb-2 truncate">{tree.scientific_name || 'Unknown species'}</p>
                        
                          {/* Only render map if we have valid coordinates - wrapped in try/catch */}
                          {hasValidLocation && (() => {
                            try {
                              return <TreeMap coordinates={coordinates} treeId={tree.id} />;
                            } catch (error) {
                              console.error('Failed to render map:', error);
                              return (
                                <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                  <div className="text-center text-text-secondary">
                                    <div className="mb-1 opacity-40">
                                      <Globe className="w-6 h-6 mx-auto" />
                                    </div>
                                    <span className="text-xs">Map unavailable</span>
                                  </div>
                                </div>
                              );
                            }
                          })()}
                          
                          <div className="flex justify-between mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <Link
                              href={`/admin/${tree.id}`}
                              className="text-primary hover:text-primary-dark text-xs flex items-center gap-1 hover:underline transition-colors"
                            >
                              <span>View Details</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                <path d="M9 18l6-6-6-6"/>
                              </svg>
                            </Link>
                            
                            <div className="flex space-x-2">
                              <Link
                                href={`/admin/edit/${tree.id}`}
                                className="p-1.5 text-text-secondary hover:text-primary rounded-full hover:bg-primary-light/10 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span className="sr-only">Edit</span>
                              </Link>
                            
                              <button
                                onClick={() => deleteTree(tree.id)}
                                className="p-1.5 text-text-secondary hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="sr-only">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Add pagination */}
                <Pagination />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}