import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, getPartnerId } from '../lib/supabase'

const INACTIVE_THRESHOLD_MS = 3 * 60 * 1000 // 3 minutes since last update
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export const usePartnerLocation = (userId) => {
  const [partnerLocation, setPartnerLocation] = useState(null)
  const [partnerLastUpdate, setPartnerLastUpdate] = useState(null)
  const [partnerIsActive, setPartnerIsActive] = useState(false)
  const [partnerIsInactive, setPartnerIsInactive] = useState(false)
  const channelRef = useRef(null)
  const retryCountRef = useRef(0)
  const partnerIsActiveRef = useRef(false)

  // Determine if partner is inactive
  // Uses time-based detection as the PRIMARY signal.
  // is_active in the DB can be stale if partner force-killed the app
  // (cleanup never runs, so is_active stays true forever).
  const checkInactivity = useCallback(() => {
    if (!partnerLastUpdate) return true
    const now = new Date()
    const diff = now - partnerLastUpdate
    // Inactive if no update received within threshold
    // OR if partner explicitly set is_active=false (graceful stop)
    if (diff > INACTIVE_THRESHOLD_MS) return true
    if (!partnerIsActiveRef.current) return true
    return false
  }, [partnerLastUpdate])

  // Check inactivity every 5 seconds for responsive grey-icon detection
  useEffect(() => {
    const interval = setInterval(() => {
      setPartnerIsInactive(checkInactivity())
    }, 5000)

    return () => clearInterval(interval)
  }, [checkInactivity])

  useEffect(() => {
    if (!userId) return

    const partnerId = getPartnerId(userId)
    let isCleanedUp = false

    // Fetch partner location from Supabase
    const fetchPartnerLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', partnerId)
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data) {
          setPartnerLocation({ lat: data.lat, lng: data.lng })
          setPartnerLastUpdate(new Date(data.updated_at))
          setPartnerIsActive(data.is_active || false)
          partnerIsActiveRef.current = data.is_active || false
        }
      } catch (err) {
        console.error('Error fetching partner location:', err)
      }
    }

    fetchPartnerLocation()

    // Subscribe to real-time updates with unique channel name
    const channelName = `partner-location-${userId}-${partnerId}`

    const createChannel = () => {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'locations',
            filter: `user_id=eq.${partnerId}`
          },
          (payload) => {
            if (payload.new) {
              setPartnerLocation({ lat: payload.new.lat, lng: payload.new.lng })
              setPartnerLastUpdate(new Date(payload.new.updated_at))
              setPartnerIsActive(payload.new.is_active || false)
              partnerIsActiveRef.current = payload.new.is_active || false
            }
          }
        )
        .subscribe((status) => {
          if (isCleanedUp) return

          if (status === 'SUBSCRIBED') {
            retryCountRef.current = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`Realtime channel ${status} for:`, channelName)
            if (retryCountRef.current < MAX_RETRIES) {
              retryCountRef.current++
              setTimeout(() => {
                if (!isCleanedUp) {
                  supabase.removeChannel(channel)
                  channelRef.current = createChannel()
                }
              }, RETRY_DELAY_MS)
            } else {
              console.error('Max retries reached for realtime channel:', channelName)
            }
          }
        })

      return channel
    }

    channelRef.current = createChannel()

    // Handle app returning from background - always force-refresh
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCleanedUp) {
        // Always re-fetch from DB - this is the source of truth
        // Covers any updates that happened while backgrounded
        fetchPartnerLocation()

        // Always re-subscribe the channel on foreground resume.
        // The channel may report as "joined" but silently not deliver messages
        // after being backgrounded (WebSocket was dropped by the OS/browser).
        // A fresh subscription guarantees a live connection.
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
        }
        retryCountRef.current = 0
        channelRef.current = createChannel()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isCleanedUp = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId])

  return {
    partnerLocation,
    partnerLastUpdate,
    partnerIsActive,
    partnerIsInactive
  }
}