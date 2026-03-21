// Map Controls Bar - Horizontal scrolling bar with map action buttons
const MapControlsBar = ({ 
  canShowRoute,
  showRoute,
  onToggleRoute,
  myLocation,
  mapRef,
  partnerLocation,
  centerOnPartner,
  setCenterOnPartner,
  isTracking,
  setIsTracking,
  userColors,
  partnerColors
}) => {
  const handleCenterOnMe = () => {
    if (mapRef.current && myLocation) {
      mapRef.current.flyTo([myLocation.lat, myLocation.lng], 17, {
        duration: 0.5
      })
    }
  }

  const handleCenterOnPartner = () => {
    if (mapRef.current && partnerLocation) {
      mapRef.current.flyTo([partnerLocation.lat, partnerLocation.lng], 15, {
        duration: 1
      })
    }
  }

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1)
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() - 1)
    }
  }

  return (
    <div className="absolute bottom-28 left-0 right-0 z-[1000] px-0">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
        {/* Tracking Status */}
        {setIsTracking && (
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex-shrink-0 p-2.5 rounded-xl shadow-lg transition-colors ${
              isTracking
                ? 'bg-purple-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
            title={isTracking ? 'Tracking Active' : 'Tracking Paused'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Center on Me - Your color */}
        {myLocation && (
          <button
            onClick={handleCenterOnMe}
            className="flex-shrink-0 w-10 h-10 shadow-lg rounded-xl text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: userColors.primary }}
          >
            {userColors.displayName}
          </button>
        )}

        {/* Center on Partner - Partner's color */}
        {partnerLocation && (
          <button
            onClick={handleCenterOnPartner}
            className="flex-shrink-0 w-10 h-10 shadow-lg rounded-xl text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: partnerColors.primary }}
          >
            {partnerColors.displayName}
          </button>
        )}

        {/* Route Toggle */}
        {canShowRoute && (
          <button
            onClick={onToggleRoute}
            className={`flex-shrink-0 flex items-center gap-2 shadow-lg px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              showRoute 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg hover:bg-white dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>{showRoute ? 'lapit na yannn' : 'layo pa ba?'}</span>
          </button>
        )}

        {/* Follow Partner Toggle - Purple */}
        {partnerLocation && setCenterOnPartner && (
          <button
            onClick={() => setCenterOnPartner(!centerOnPartner)}
            className={`flex-shrink-0 flex items-center gap-2 shadow-lg px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              centerOnPartner
                ? 'text-white'
                : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg text-purple-600 dark:text-purple-400'
            }`}
            style={{ 
              backgroundColor: centerOnPartner ? '#9333EA' : undefined
            }}
            title={centerOnPartner ? 'Following Partner' : 'Follow Partner'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <span>follow {partnerColors.displayName}</span>
          </button>
        )}

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="flex-shrink-0 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="flex-shrink-0 w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MapControlsBar
