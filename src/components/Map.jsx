import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import MapControlsBar from './MapControlsBar'
import { getUserColors, getPartnerColors } from '../lib/supabase'

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (type, userColors, partnerColors, isInactive = false) => {
  const colors = type === 'me' ? userColors : partnerColors
  const initial = type === 'me' ? userColors.name : partnerColors.name
  const bgColor = isInactive ? '#9CA3AF' : colors.primary // Gray when inactive
  
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker marker-${type}" style="background-color: ${bgColor}">${initial}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

// Component to center map on partner
const CenterOnPartner = ({ partnerLocation }) => {
  const map = useMap()
  
  useEffect(() => {
    if (partnerLocation) {
      // Only center, don't change zoom
      map.flyTo([partnerLocation.lat, partnerLocation.lng], map.getZoom(), {
        duration: 1
      })
    }
  }, [partnerLocation, map])
  
  return null
}

// Component to center map on my location when first loaded
const CenterOnMyLocation = ({ myLocation }) => {
  const map = useMap()
  const hasCenteredRef = useRef(false)
  
  useEffect(() => {
    if (myLocation && !hasCenteredRef.current) {
      hasCenteredRef.current = true
      // Only center, don't change zoom
      map.flyTo([myLocation.lat, myLocation.lng], map.getZoom(), {
        duration: 1
      })
    }
  }, [myLocation, map])
  
  return null
}

// Route drawer component - handles both OSRM and simple line fallback
const RouteDrawer = ({ myLocation, partnerLocation, showRoute }) => {
  const map = useMap()
  const routeLayerRef = useRef(null)
  const [routeInfo, setRouteInfo] = useState(null)

  useEffect(() => {
    if (!map) return

    // Remove existing route
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current)
      routeLayerRef.current = null
    }
    setRouteInfo(null)

    if (!myLocation || !partnerLocation || !showRoute) return

    // Try fetching route from OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${myLocation.lng},${myLocation.lat};${partnerLocation.lng},${partnerLocation.lat}?overview=full&geometries=geojson`

    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    fetch(osrmUrl, { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId)
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]])

          // Create polyline
          const polyline = L.polyline(coordinates, {
            color: '#8B5CF6',
            weight: 6,
            opacity: 0.8
          }).addTo(map)

          // Create alternative lighter line on top
          const polylineTop = L.polyline(coordinates, {
            color: '#A78BFA',
            weight: 3,
            opacity: 1
          }).addTo(map)

          // Group them together
          routeLayerRef.current = L.layerGroup([polyline, polylineTop]).addTo(map)

          // Set route info
          const distanceKm = (route.distance / 1000).toFixed(1)
          const timeMin = Math.round(route.duration / 60)
          setRouteInfo({ distance: distanceKm, time: timeMin })
        } else {
          // No route found, use simple line
          drawSimpleLine()
        }
      })
      .catch(err => {
        clearTimeout(timeoutId)
        console.log('Route fetch failed, using simple line:', err.message)
        drawSimpleLine()
      })

    const drawSimpleLine = () => {
      const line = L.polyline(
        [[myLocation.lat, myLocation.lng], [partnerLocation.lat, partnerLocation.lng]],
        {
          color: '#8B5CF6',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10'
        }
      ).addTo(map)
      routeLayerRef.current = line
    }

    return () => {
      clearTimeout(timeoutId)
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current)
        routeLayerRef.current = null
      }
    }
  }, [map, myLocation, partnerLocation, showRoute])

  return routeInfo ? (
    <div className="absolute top-16 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm">
      <div className="font-semibold text-purple-600">Route Info</div>
      <div className="text-gray-700">Distance: {routeInfo.distance} km</div>
      <div className="text-gray-700">Time: ~{routeInfo.time} min</div>
    </div>
  ) : null
}

const Map = ({ 
  myLocation, 
  partnerLocation, 
  centerOnPartner,
  setCenterOnPartner,
  showRoute,
  onToggleRoute,
  isTracking,
  setIsTracking,
  userId,
  partnerIsInactive
}) => {
  // Get colors based on user identity
  const userColors = getUserColors(userId)
  const partnerColors = getPartnerColors(userId)
  const mapRef = useRef(null)

  // Default center (Manila, Philippines)
  const defaultCenter = [14.5995, 120.9842]
  
  const center = myLocation 
    ? [myLocation.lat, myLocation.lng] 
    : defaultCenter

  const handleCenterOnPartner = () => {
    if (mapRef.current && partnerLocation) {
      // Only center, don't change zoom
      mapRef.current.flyTo([partnerLocation.lat, partnerLocation.lng], mapRef.current.getZoom(), {
        duration: 1
      })
    }
  }

  const canShowRoute = myLocation && partnerLocation

  return (
    <div className="relative w-full h-full overflow-visible">
      <MapContainer
        center={center}
        zoom={15}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* My location marker */}
        {myLocation && (
          <Marker 
            position={[myLocation.lat, myLocation.lng]}
            icon={createCustomIcon('me', userColors, partnerColors)}
          >
            <Popup>
              <div className="text-center">
                <strong>Me</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Partner location marker */}
        {partnerLocation && (
          <Marker 
            position={[partnerLocation.lat, partnerLocation.lng]}
            icon={createCustomIcon('partner', userColors, partnerColors, partnerIsInactive)}
          >
            <Popup>
              <div className="text-center">
                <strong>Partner</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {centerOnPartner && partnerLocation && (
          <CenterOnPartner partnerLocation={partnerLocation} />
        )}

        {/* Center on my location when first loaded */}
        <CenterOnMyLocation myLocation={myLocation} />

        {/* Route Drawer - handles both OSRM and simple line fallback */}
        <RouteDrawer
          myLocation={myLocation}
          partnerLocation={partnerLocation}
          showRoute={showRoute}
        />
      </MapContainer>
      
      {/* Map Controls Bar - Above Bottom Nav */}
      <MapControlsBar
        canShowRoute={canShowRoute}
        showRoute={showRoute}
        onToggleRoute={onToggleRoute}
        myLocation={myLocation}
        mapRef={mapRef}
        partnerLocation={partnerLocation}
        centerOnPartner={centerOnPartner}
        setCenterOnPartner={setCenterOnPartner}
        isTracking={isTracking}
        setIsTracking={setIsTracking}
        userColors={userColors}
        partnerColors={partnerColors}
      />
    </div>
  )
}

export default Map
