import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Tree } from '../types/tree'

interface MapProps {
  trees: Tree[]
  selectedTree: Tree | null
  onTreeSelect: (tree: Tree) => void
}

export default function Map({ trees, selectedTree, onTreeSelect }: MapProps) {
  // Default center coordinates for Amman, Jordan
  const defaultCenter: [number, number] = [31.9539, 35.9106]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {trees.map((tree) => {
        // Skip markers with invalid coordinates
        if (!tree.latitude && !tree.lat) return null;
        if (!tree.longitude && !tree.lng) return null;
        
        // Use either latitude/longitude or lat/lng
        const lat = tree.latitude || tree.lat;
        const lng = tree.longitude || tree.lng;
        
        return (
          <Marker
            key={`tree-${tree.id}`} // Ensure unique key based on tree ID
            position={[lat!, lng!]}
            eventHandlers={{ click: () => onTreeSelect(tree) }}
          >
            <Popup>
              <div>
                <h3>{tree.name}</h3>
                {tree.pin_location_img ? (
                  <img 
                    src={tree.pin_location_img} 
                    alt={tree.name} 
                    style={{ maxWidth: '100%', maxHeight: '150px' }} 
                  />
                ) : tree.image_url ? (
                  <img 
                    src={tree.image_url} 
                    alt={tree.name} 
                    style={{ maxWidth: '100%', maxHeight: '150px' }} 
                  />
                ) : null}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  )
} 