import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const WRITE_THROTTLE_MS = 5000 // Max once per 5 seconds

export const useLocation = (userId, isTracking) => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const watchIdRef = useRef(null)
  const updateIntervalRef = useRef(null)
  const currentLocationRef = useRef(null)
  const trackingGenRef = useRef(0)
  const lastWriteTimeRef = useRef(0)
  const isTrackingRef = useRef(isTracking)
  isTrackingRef.current = isTracking

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
      lastWriteTimeRef.current = Date.now()
    } catch (err) {
      console.error('Error updating location:', err)
    }
  }, [userId])

  // Start watching position
  useEffect(() => {
    if (!isTracking || !userId) return

    const gen = ++trackingGenRef.current
    lastWriteTimeRef.current = 0

    const startTracking = () => {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser')
        return
      }

      // Throttled write helper — writes to Supabase if enough time has passed
      const throttledWrite = (lat, lng) => {
        const now = Date.now()
        if (now - lastWriteTimeRef.current >= WRITE_THROTTLE_MS) {
          updateLocation(lat, lng)
        }
      }

      // Initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (trackingGenRef.current !== gen) return
          const { latitude, longitude } = position.coords
          setCurrentLocation({ lat: latitude, lng: longitude })
          updateLocation(latitude, longitude)
        },
        (error) => {
          if (trackingGenRef.current !== gen) return
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
          if (trackingGenRef.current !== gen) return
          const { latitude, longitude } = position.coords
          const loc = { lat: latitude, lng: longitude }
          setCurrentLocation(loc)
          currentLocationRef.current = loc
          setLocationError(null)
          // Write to Supabase on movement (throttled)
          throttledWrite(latitude, longitude)
        },
        (error) => {
          if (trackingGenRef.current !== gen) return
          setLocationError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      )

      // Update to Supabase every 5 seconds
      updateIntervalRef.current = setInterval(() => {
        if (trackingGenRef.current !== gen) return
        if (currentLocationRef.current) {
          updateLocation(currentLocationRef.current.lat, currentLocationRef.current.lng)
        }
      }, 5000)

      // Handle app returning from background — refresh location immediately
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && trackingGenRef.current === gen) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (trackingGenRef.current !== gen) return
              const { latitude, longitude } = position.coords
              const loc = { lat: latitude, lng: longitude }
              setCurrentLocation(loc)
              currentLocationRef.current = loc
              setLocationError(null)
              updateLocation(latitude, longitude)
            },
            () => {},
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    const cleanupListeners = startTracking()

    // Cleanup
    return () => {
      if (cleanupListeners) cleanupListeners()
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
      // Use ref to read CURRENT isTracking, not the stale closure value
      if (!isTrackingRef.current && currentLocationRef.current) {
        updateLocation(currentLocationRef.current.lat, currentLocationRef.current.lng, false)
      }
    }
  }, [isTracking, userId, updateLocation])

  // Handle page close/unload — mark as inactive
  // Mounted whenever userId exists so it fires even after tracking stops
  useEffect(() => {
    if (!userId) return

    const handleBeforeUnload = () => {
      if (currentLocationRef.current && isTrackingRef.current === false) {
        const payload = JSON.stringify({
          user_id: userId,
          lat: currentLocationRef.current.lat,
          lng: currentLocationRef.current.lng,
          updated_at: new Date().toISOString(),
          is_active: false
        })
        fetch(`${supabase.supabaseUrl}/rest/v1/locations?onConflict=user_id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabase.supabaseKey,
            Authorization: `Bearer ${supabase.supabaseKey}`,
            Prefer: 'resolution=merge-duplicates'
          },
          body: payload,
          keepalive: true
        }).catch(() => {})
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [userId])

  return {
    currentLocation,
    locationError,
    lastUpdate
  }
}
