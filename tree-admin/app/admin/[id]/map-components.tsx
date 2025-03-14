'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapEvents } from 'react-leaflet';
import { toast } from 'react-hot-toast';

// Define the LatLngTuple type
type LatLngTuple = [number, number];

// Default coordinates for La Union, Naguilian
const DEFAULT_COORDINATES: LatLngTuple = [16.5324, 120.3929]; 
const DEFAULT_ZOOM = 13;

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

// Parse coordinates from string or object to array of pin data objects
const parseCoordinates = (location: string | any): { 
  coord: LatLngTuple; 
  icon?: string; 
  image?: string;
}[] => {
  try {
    if (!location) return [];
    
    // Handle direct object input (e.g. from MySQL JSON type column)
    let locationData;
    
    if (typeof location === 'string') {
      // Try to parse the JSON string
      try {
        locationData = JSON.parse(location);
      } catch (e) {
        console.error('Failed to parse location JSON:', e);
        return [];
      }
    } else {
      // Already an object, use directly
      locationData = location;
    }
    
    // If it's an array of strings (old format), convert to new format
    if (Array.isArray(locationData) && locationData.length > 0 && locationData.every(item => typeof item === 'string')) {
      return locationData.map(coordStr => {
        const [lat, lng] = coordStr.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { coord: [lat, lng] };
      }).filter(Boolean) as { coord: LatLngTuple }[];
    }
    
    // If it's already in new format (array of objects)
    if (Array.isArray(locationData) && locationData.length > 0 && typeof locationData[0] === 'object') {
      return locationData
        .map(item => {
          // Handle case where coord is stored as string "lat,lng"
          if (typeof item.coord === 'string') {
            const [lat, lng] = item.coord.split(',').map(Number);
            if (isNaN(lat) || isNaN(lng)) return null;
            return {
              coord: [lat, lng] as LatLngTuple,
              icon: item.icon || undefined,
              image: item.image || undefined
            };
          }
          // Handle case where coord is already an array [lat, lng]
          else if (Array.isArray(item.coord) && item.coord.length === 2) {
            const [lat, lng] = item.coord;
            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return null;
            return {
              coord: [lat, lng] as LatLngTuple,
              icon: item.icon || undefined,
              image: item.image || undefined
            };
          }
          return null;
        })
        .filter(Boolean) as { coord: LatLngTuple; icon?: string; image?: string }[];
    }
    
    // If we couldn't parse it correctly, return empty array
    console.error('Invalid location data format:', locationData);
    return [];
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return [];
  }
};

// Add a function to fetch map settings
async function getMapSettings() {
  try {
    const response = await fetch('/api/settings?keys=default_map_center,default_map_zoom');
    if (!response.ok) {
      throw new Error('Failed to fetch map settings');
    }
    const data = await response.json();
    
    let center = DEFAULT_COORDINATES;
    let zoom = DEFAULT_ZOOM;
    
    if (data.default_map_center) {
      try {
        const centerData = JSON.parse(data.default_map_center);
        if (centerData && typeof centerData.lat === 'number' && typeof centerData.lng === 'number') {
          center = [centerData.lat, centerData.lng];
        }
      } catch (e) {
        console.error('Error parsing map center settings:', e);
      }
    }
    
    if (data.default_map_zoom && !isNaN(Number(data.default_map_zoom))) {
      zoom = Number(data.default_map_zoom);
    }
    
    return { center, zoom };
  } catch (error) {
    console.error('Error fetching map settings:', error);
    return { center: DEFAULT_COORDINATES, zoom: DEFAULT_ZOOM };
  }
}

// Map click handler component
const MapClickHandler = ({ onClick }: { onClick: (e: any) => void }) => {
  useMapEvents({
    click: onClick,
  });
  return null;
};

// Tree map component to be used client-side only
export function TreeMapClient({ 
  formData, 
  setFormData,
  handleMapClick 
}: { 
  formData: any; 
  setFormData: (data: any) => void; 
  handleMapClick: (e: any) => void;
}) {
  const [mapIcon, setMapIcon] = useState<L.Icon | null>(null);
  const [mapSettings, setMapSettings] = useState({ center: DEFAULT_COORDINATES, zoom: DEFAULT_ZOOM });
  
  useEffect(() => {
    // Create custom icon with shadow
    const customIcon = new L.Icon({
      iconUrl: '/pin.png', // Default pin
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    setMapIcon(customIcon);
    
    // Fetch map settings
    getMapSettings().then(settings => {
      setMapSettings(settings);
    });
  }, []);
  
  // Parse the coordinates from the form data
  const pinData = parseCoordinates(formData.location);
  
  // Set initial center based on: 
  // 1. Existing pins if available
  // 2. Map settings from database
  // 3. Default La Union coordinates
  const initialCenter: LatLngTuple = 
    pinData.length > 0 ? pinData[0].coord : mapSettings.center;

  // Create a custom map icon when needed
  const createCustomIcon = (iconUrl: string) => {
    try {
      return new L.Icon({
        iconUrl,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    } catch (error) {
      console.error('Error creating custom icon:', error);
      return mapIcon;
    }
  };
  
  // Handle marker drag to update coordinates
  const handleDragEnd = (e: any, index: number) => {
    const { lat, lng } = e.target.getLatLng();
    
    const currentPinData = parseCoordinates(formData.location || '[]');
    // Update only the coordinate, keep icon and image
    if (currentPinData[index]) {
      currentPinData[index].coord = [lat, lng];
    }
    
    setFormData({
      ...formData, 
      location: JSON.stringify(currentPinData)
    });
    
    toast.success('Marker position updated');
  };
  
  // Handle right-click to remove a marker
  const handleContextMenu = (index: number) => {
    // Remove this coordinate on right-click
    const currentPinData = parseCoordinates(formData.location || '[]');
    const updatedPinData = currentPinData.filter((_, i) => i !== index);
    
    setFormData({
      ...formData,
      location: JSON.stringify(updatedPinData)
    });
    
    toast.success('Marker removed');
  };
  
  return (
    <div className="h-full rounded-lg overflow-hidden">
      <MapContainer
        center={initialCenter}
        zoom={mapSettings.zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* Use the MapClickHandler component */}
        <MapClickHandler onClick={handleMapClick} />
        {pinData.map((pin, index) => {
          // Get a custom icon for this pin if available, otherwise use the default
          const pinIcon = pin.icon ? 
            createCustomIcon(pin.icon) : 
            mapIcon;
          
          return (
            <Marker
              key={index}
              position={pin.coord}
              draggable={true}
              icon={pinIcon || undefined}
              eventHandlers={{
                dragend: (e) => handleDragEnd(e, index),
                contextmenu: () => handleContextMenu(index)
              }}
            >
              <Popup>
                <div className="text-center p-2">
                  <h4 className="font-medium">Pin Location</h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {pin.coord[0].toFixed(4)}, {pin.coord[1].toFixed(4)}
                  </p>
                  
                  {/* Show pin-specific location image if available */}
                  {pin.image && (
                    <div className="mb-2">
                      <img 
                        src={pin.image} 
                        alt="Pin location" 
                        className="w-full h-20 object-cover rounded"
                      />
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-600 mt-2">
                    <p>Right-click to remove pin</p>
                    <p>Drag to reposition</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
} 