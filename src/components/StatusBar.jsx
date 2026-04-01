import { useState, useEffect } from 'react'
import { USER_IDS, getUserColors, getPartnerColors } from '../lib/supabase'

const StatusBar = ({ myLastUpdate, partnerLastUpdate, locationError, isTracking, userId, myIsActive, partnerIsActive }) => {
  const [, setTick] = useState(0)

  // Auto-refresh time display every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000)
    return () => clearInterval(interval)
  }, [])

  // Get my label (C or R) based on current user
  // Default to 'C' if userId is not available yet
  const isBigC = userId === USER_IDS.BIG_C
  const myLabel = isBigC ? 'C' : 'R'
  const partnerLabel = isBigC ? 'R' : 'C'
  
  const formatTime = (date) => {
    if (!date) return 'never'
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 5) return 'now lang po'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return date.toLocaleTimeString()
  }

  const formatStatus = (lastUpdate, isActive) => {
    if (isActive) return 'active yarn'
    return formatTime(lastUpdate)
  }

  return (
    <div className="absolute top-4 left-4 right-4 z-[1000] rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* My status */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isTracking ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {myLabel}: {formatStatus(myLastUpdate, myIsActive)}
            </span>
          </div>
          
          {/* Partner status */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${partnerIsActive ? 'bg-purple-500' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {partnerLabel}: {formatStatus(partnerLastUpdate, partnerIsActive)}
            </span>
          </div>
        </div>
        
        {/* Error message */}
        {locationError && (
          <div className="text-sm text-red-500">
            {locationError}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusBar
