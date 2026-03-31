import { useState, useEffect, useCallback } from 'react'
import { supabase, getPartnerId } from '../lib/supabase'

const INACTIVE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

export const usePartnerLocation = (userId) => {
  const [partnerLocation, setPartnerLocation] = useState(null)
  const [partnerLastUpdate, setPartnerLastUpdate] = useState(null)
  const [partnerIsActive, setPartnerIsActive] = useState(false)
  const [partnerIsInactive, setPartnerIsInactive] = useState(false)

  // Check if partner is inactive based on last update time
  const checkInactivity = useCallback(() => {
    if (!partnerLastUpdate) return true
    const now = new Date()
    const diff = now - partnerLastUpdate
    return diff > INACTIVE_THRESHOLD_MS
  }, [partnerLastUpdate])

  // Update inactivity status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPartnerIsInactive(checkInactivity())
    }, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
  }, [checkInactivity])

  useEffect(() => {
    if (!userId) return

    const partnerId = getPartnerId(userId)

    // Fetch initial partner location
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
        }
      } catch (err) {
        console.error('Error fetching partner location:', err)
      }
    }

    fetchPartnerLocation()

    // Subscribe to real-time updates with unique channel name
    const channelName = `partner-location-${userId}-${partnerId}`
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
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime subscription error for channel:', channelName)
        } else if (status === 'TIMED_OUT') {
          console.warn('Realtime subscription timed out for channel:', channelName)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    partnerLocation,
    partnerLastUpdate,
    partnerIsActive,
    partnerIsInactive
  }
}
