import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Map from './components/Map'
import StatusBar from './components/StatusBar'
import { useLocation } from './hooks/useLocation'
import { usePartnerLocation } from './hooks/usePartnerLocation'

// Generate a unique session ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// Check and update session in database
const updateSession = async (userId, sessionId) => {
  if (!userId || !sessionId) return null
  
  try {
    // Preserve existing coordinates instead of overwriting with 0,0
    const { data: existing } = await supabase
      .from('locations')
      .select('lat, lng')
      .eq('user_id', userId)
      .single()

    const { data, error } = await supabase
      .from('locations')
      .upsert({
        user_id: userId,
        lat: existing?.lat ?? 0,
        lng: existing?.lng ?? 0,
        session_id: sessionId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select('session_id')
      .single()
    
    if (error) throw error
    return data?.session_id
  } catch (err) {
    console.error('Session update error:', err)
    return null
  }
}

// Get current session from database
const getSession = async (userId) => {
  if (!userId) return null
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('session_id')
      .eq('user_id', userId)
      .single()
    
    if (error) return null
    return data?.session_id
  } catch (err) {
    return null
  }
}

// Placeholder components for navigation
const Album = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">album</h2>
      <p className="text-gray-500 dark:text-gray-400">upload tayo pics dito soon</p>
    </div>
  </div>
)

const MapScreen = ({ 
  myLocation, 
  partnerLocation, 
  centerOnPartner, 
  setCenterOnPartner,
  showRoute, 
  setShowRoute,
  isTracking,
  setIsTracking,
  locationError,
  myLastUpdate,
  partnerLastUpdate,
  partnerIsActive,
  partnerIsInactive,
  onLogout,
  userId
}) => (
  <div className="w-full h-full relative">
    <StatusBar 
      myLastUpdate={myLastUpdate}
      partnerLastUpdate={partnerLastUpdate}
      locationError={locationError}
      isTracking={isTracking}
      userId={userId}
      myIsActive={isTracking}
      partnerIsActive={partnerIsActive}
    />
    <Map 
      myLocation={myLocation}
      partnerLocation={partnerLocation}
      centerOnPartner={centerOnPartner}
      setCenterOnPartner={setCenterOnPartner}
      showRoute={showRoute}
      onToggleRoute={() => setShowRoute(!showRoute)}
      isTracking={isTracking}
      setIsTracking={setIsTracking}
      userId={userId}
      partnerIsInactive={partnerIsInactive}
    />
  </div>
)

const Home = () => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-indigo-50 dark:from-indigo-900 to-purple-50 dark:to-purple-900">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">home</h2>
      <p className="text-gray-500 dark:text-gray-400">blangko po muna hehe</p>
    </div>
  </div>
)

const Calendar = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">calendar</h2>
      <p className="text-gray-500 dark:text-gray-400">dates and reminders natin dito</p>
    </div>
  </div>
)

const Us = ({ onLogout, isDarkMode, setIsDarkMode }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">us</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">hiii</p>
      
      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-center mb-6">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-xl shadow-lg transition-all duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {isDarkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={onLogout}
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors"
      >
        {"logout? :<"}
      </button>
    </div>
  </div>
)

// Bottom Navigation Bar
const BottomNav = ({ currentTab, setCurrentTab }) => {
  const tabs = [
    { id: 'album', label: 'album', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'location', label: 'location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'home', label: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'calendar', label: 'calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'us', label: 'us', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' }
  ]

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div className="flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg px-2 py-2 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 w-16 ${
              currentTab === tab.id 
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            <span className="text-xs mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [userId, setUserId] = useState(null)
  const [isTracking, setIsTracking] = useState(() => {
    const saved = localStorage.getItem('isTracking')
    if (saved === null) return false
    try {
      return JSON.parse(saved)
    } catch {
      return false
    }
  })
  const [centerOnPartner, setCenterOnPartner] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('home')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === null) return false
    try {
      return JSON.parse(saved)
    } catch {
      return false
    }
  })
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('sessionId'))
  const sessionIdRef = useRef(sessionId)
  sessionIdRef.current = sessionId  // Always keep ref in sync
  const [showSessionAlert, setShowSessionAlert] = useState(false)

  // Check for existing session and saved identity on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const savedIdentity = localStorage.getItem('userIdentity')
        if (savedIdentity) {
          // Check existing session in DB
          const existingSessionId = await getSession(savedIdentity)
          
          if (existingSessionId) {
            // Use existing session - this is the same device returning
            localStorage.setItem('sessionId', existingSessionId)
            setSessionId(existingSessionId)
          } else {
            // No session exists - new device login
            const newSessionId = generateSessionId()
            localStorage.setItem('sessionId', newSessionId)
            setSessionId(newSessionId)
            await updateSession(savedIdentity, newSessionId)
          }
          setUserId(savedIdentity)
        }
      }
      setIsLoading(false)
    }
    
    checkSession()
  }, [])

  // Apply dark mode - runs on mount and when isDarkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    console.log('Dark mode:', isDarkMode) // Debug log
  }, [isDarkMode])

  // Save tracking status to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('isTracking', JSON.stringify(isTracking))
  }, [isTracking])

  // Check for session changes (detect new login from another device)
  useEffect(() => {
    if (!userId || !sessionIdRef.current) return

    const checkSession = async () => {
      const currentSessionId = sessionIdRef.current
      if (!currentSessionId) return
      
      const dbSessionId = await getSession(userId)
      console.log('Checking session:', { dbSessionId, localSessionId: currentSessionId })
      
      if (dbSessionId && dbSessionId !== currentSessionId) {
        // Session changed - another device logged in
        console.log('Session mismatch detected!')
        setShowSessionAlert(true)
      }
    }

    // Check immediately
    checkSession()

    // Poll every 10 seconds
    const interval = setInterval(checkSession, 10000)
    return () => clearInterval(interval)
  }, [userId])

  // My location hook
  const { 
    currentLocation: myLocation, 
    locationError, 
    lastUpdate: myLastUpdate 
  } = useLocation(userId, isTracking)

  // Partner location hook
  const { 
    partnerLocation, 
    partnerLastUpdate,
    partnerIsActive,
    partnerIsInactive
  } = usePartnerLocation(userId)

  // Request location permission and start tracking
  useEffect(() => {
    if (userId && !isTracking) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setIsTracking(true)
          },
          (error) => {
            console.error('Location permission denied:', error)
          }
        )
      }
    }
  }, [userId])

  const handleLogout = async () => {
    // Mark as inactive before signing out so partner sees grey immediately
    if (userId) {
      await supabase.from('locations').upsert({
        user_id: userId,
        is_active: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).catch(() => {})
    }
    await supabase.auth.signOut()
    localStorage.removeItem('userIdentity')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('isTracking')
    setUserId(null)
    setSessionId(null)
    setIsTracking(false)
    setShowSessionAlert(false)
  }

  // Handle forced logout due to new login
  const handleForcedLogout = () => {
    setShowSessionAlert(false)
    handleLogout()
  }

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">wait lang pooo...</p>
        </div>
      </div>
    )
  }

  // Show auth if not logged in
  if (!userId) {
    return <Auth 
      onAuthComplete={async (identity) => {
        // Generate new session ID
        const newSessionId = generateSessionId()
        localStorage.setItem('sessionId', newSessionId)
        setSessionId(newSessionId)
        await updateSession(identity, newSessionId)
        setUserId(identity)
      }} 
    />
  }

  // Render current tab
  const renderContent = () => {
    switch (currentTab) {
      case 'album':
        return <Album />
      case 'location':
        return (
          <MapScreen 
            myLocation={myLocation}
            partnerLocation={partnerLocation}
            centerOnPartner={centerOnPartner}
            setCenterOnPartner={setCenterOnPartner}
            showRoute={showRoute}
            setShowRoute={setShowRoute}
            isTracking={isTracking}
            setIsTracking={setIsTracking}
            locationError={locationError}
            myLastUpdate={myLastUpdate}
            partnerLastUpdate={partnerLastUpdate}
            partnerIsActive={partnerIsActive}
            partnerIsInactive={partnerIsInactive}
            onLogout={handleLogout}
            userId={userId}
          />
        )
      case 'home':
        return <Home />
      case 'calendar':
        return <Calendar />
      case 'us':
        return <Us onLogout={handleLogout} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      default:
        return <MapScreen 
          myLocation={myLocation}
          partnerLocation={partnerLocation}
          centerOnPartner={centerOnPartner}
          setCenterOnPartner={setCenterOnPartner}
          showRoute={showRoute}
          setShowRoute={setShowRoute}
          isTracking={isTracking}
          setIsTracking={setIsTracking}
          locationError={locationError}
          myLastUpdate={myLastUpdate}
          partnerLastUpdate={partnerLastUpdate}
          partnerIsActive={partnerIsActive}
          partnerIsInactive={partnerIsInactive}
          onLogout={handleLogout}
          userId={userId}
        />
    }
  }

  return (
    <div className={`w-full h-screen relative overflow-visible ${isDarkMode ? 'dark' : ''}`}>
      {/* Session Alert Notification */}
      {showSessionAlert && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 m-4 max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">
              awit, may bagong login
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              siya don ka na haha
            </p>
            <button
              onClick={handleForcedLogout}
              className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
            >
              uki, logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {renderContent()}
      
      {/* Bottom Navigation */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />
    </div>
  )
}

export default App
