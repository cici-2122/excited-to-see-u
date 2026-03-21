import { useState, useEffect } from 'react'
import { supabase, getPartnerId } from '../lib/supabase'

export const usePartnerLocation = (userId) => {
  const [partnerLocation, setPartnerLocation] = useState(null)
  const [partnerLastUpdate, setPartnerLastUpdate] = useState(null)

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
        }
      } catch (err) {
        console.error('Error fetching partner location:', err)
      }
    }

    fetchPartnerLocation()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('partner-location')
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
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return {
    partnerLocation,
    partnerLastUpdate
  }
}
