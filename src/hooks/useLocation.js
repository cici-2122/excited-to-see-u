import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const useLocation = (userId, isTracking) => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const watchIdRef = useRef(null)
  const updateIntervalRef = useRef(null)
  const currentLocationRef = useRef(null)

  // Function to update location in Supabase
  const updateLocation = useCallback(async (lat, lng, isActive = true) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('locations')
        .upsert(
          {
            user_id: userId,
            lat,
            lng,
            updated_at: new Date().toISOString(),
            is_active: isActive
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error updating location:', err)
    }
  }, [userId])

  // Start watching position
  useEffect(() => {
    if (!isTracking || !userId) return

    const startTracking = () => {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser')
        return
      }

      // Initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })
          updateLocation(latitude, longitude)
        },
        (error) => {
          setLocationError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      )

      // Watch position continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const loc = { lat: latitude, lng: longitude }
          setCurrentLocation(loc)
          currentLocationRef.current = loc
          setLocationError(null)
        },
        (error) => {
          setLocationError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      )

      // Update to Supabase every 30 seconds (less network traffic)
      updateIntervalRef.current = setInterval(() => {
        if (currentLocationRef.current) {
          updateLocation(currentLocationRef.current.lat, currentLocationRef.current.lng)
        }
      }, 30000)
    }

    startTracking()

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      // Set is_active to false when tracking stops
      if (currentLocationRef.current) {
        updateLocation(currentLocationRef.current.lat, currentLocationRef.current.lng, false)
      }
    }
  }, [isTracking, userId, updateLocation])

  return {
    currentLocation,
    locationError,
    lastUpdate
  }
}
