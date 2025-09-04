import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ChevronUp, ChevronDown, MapPin, Globe, Navigation, Save, User, Layers, AlertTriangle } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'

const NavigationLayout: React.FC = () => {
  const [isNavMode, setIsNavMode] = useState(false)
  const [showMapStylePanel, setShowMapStylePanel] = useState(false)
  const [showSavedRoutesPanel, setShowSavedRoutesPanel] = useState(false)
  const [showBoatProfilePanel, setShowBoatProfilePanel] = useState(false)
  const [showReportPanel, setShowReportPanel] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null)
  const location = useLocation()
  const { settings, updateSetting } = useSettings()
  
  // Only show navigation popup on the main navigation page
  const isNavigationPage = location.pathname === '/'
  
  // Saved routes state
  const [savedRoutes, setSavedRoutes] = useState<Array<{
    id: string
    name: string
    startPoint: [number, number]
    endPoint: [number, number]
    routeData?: any
  }>>([])
  
  const toggleNavigationMode = () => {
    setIsNavMode(!isNavMode)
  }

  // Handle saved routes
  useEffect(() => {
    // Load saved routes from localStorage on startup
    const loadSavedRoutes = () => {
      try {
        const savedRoutesKey = 'vaarpro_saved_routes'
        const savedRoutesData = localStorage.getItem(savedRoutesKey)
        if (savedRoutesData) {
          const routes = JSON.parse(savedRoutesData)
          setSavedRoutes(routes)
        }
      } catch (error) {
        console.warn('Failed to load saved routes:', error)
      }
    }

    const handleRouteSaved = (event: CustomEvent) => {
      const { route } = event.detail
      setSavedRoutes(prev => {
        const newRoutes = [...prev, route]
        // Keep only the last 3 routes
        return newRoutes.slice(-3)
      })
    }

    // Load routes on startup
    loadSavedRoutes()

    window.addEventListener('routeSaved', handleRouteSaved as EventListener)
    
    return () => {
      window.removeEventListener('routeSaved', handleRouteSaved as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-base-50">
      {/* Navigation HUD - Full-width header when in navigation mode */}
      {isNavMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-base-200 shadow-soft">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                <span className="text-base-800 text-sm font-bold">V</span>
              </div>
              <span className="ui-heading-3 text-brand">Navigation Mode</span>
            </div>
            <button
              onClick={() => setIsNavMode(false)}
              className="ui-button-secondary"
            >
              Exit Navigation
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isNavMode ? 'pt-20' : ''}>
        <Outlet />
      </div>

      {/* Floating Action Buttons - Right side */}
      <div className="fixed right-4 top-4 z-40 flex flex-col gap-4">
        
        {/* Boat Profile Button */}
        <button
          onClick={() => setShowBoatProfilePanel(!showBoatProfilePanel)}
          className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-card flex items-center justify-center transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Boat Profile"
        >
          <User size={24} />
        </button>

        {/* Show on Map Button */}
        <button
          onClick={() => {
            // This will be handled by the NavigationPage component
            window.dispatchEvent(new CustomEvent('toggleShowMapPanel'))
          }}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full shadow-card flex items-center justify-center hover:brightness-95 transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Show on Map"
        >
          <Layers size={24} />
        </button>

        {/* Map Style Button */}
        <button
          onClick={() => setShowMapStylePanel(!showMapStylePanel)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-card flex items-center justify-center transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Map Style"
        >
          <Globe size={24} />
        </button>

        {/* Saved Routes Button */}
        <button
          onClick={() => setShowSavedRoutesPanel(!showSavedRoutesPanel)}
          className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-card flex items-center justify-center transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Saved Routes"
        >
          <Save size={24} />
        </button>


        {/* Report Button */}
        <button
          onClick={() => setShowReportPanel(!showReportPanel)}
          className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-full shadow-card flex items-center justify-center hover:brightness-95 transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Report Issue"
        >
          <AlertTriangle size={24} />
        </button>

        {/* Locate Me Button */}
        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords
                  // Dispatch event to be handled by NavigationPage
                  window.dispatchEvent(new CustomEvent('locateMe', { 
                    detail: { lat: latitude, lng: longitude } 
                  }))
                },
                (error) => {
                  console.error('Geolocation error:', error)
                  alert('Unable to get your location. Please check location permissions.')
                }
              )
            } else {
              alert('Geolocation is not supported by this browser.')
            }
          }}
          className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full shadow-card flex items-center justify-center hover:brightness-95 transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Locate Me"
        >
          <MapPin size={24} />
        </button>
      </div>



      {/* Start Navigation Button - Bottom Right */}
      {isNavigationPage && (
        <button
          onClick={() => {
            // This will be handled by the NavigationPage component
            window.dispatchEvent(new CustomEvent('showNavigationModal'))
          }}
          className="fixed bottom-24 right-4 z-40 w-16 h-16 bg-black text-white rounded-full shadow-card flex items-center justify-center hover:bg-gray-800 transition-all duration-200 active:scale-[0.98] border border-white/30"
          title="Start Navigation"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Navigation Mode Toggle - Central floating button - Only show on main navigation page */}
      {isNavigationPage && (
        <button
          onClick={toggleNavigationMode}
          className="fixed left-1/2 bottom-6 transform -translate-x-1/2 z-40 w-16 h-16 bg-brand text-base-800 rounded-full shadow-card flex items-center justify-center hover:brightness-95 transition-all duration-200 active:scale-[0.98]"
          title={isNavMode ? 'Exit Navigation' : 'Enter Navigation'}
        >
          {isNavMode ? <ChevronDown size={28} /> : <ChevronUp size={28} />}
        </button>
      )}

      {/* Map Style Panel */}
      {showMapStylePanel && (
        <div className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-64 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Map Style</h3>
            <button
              onClick={() => setShowMapStylePanel(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('changeMapStyle', { detail: { style: 'standard' } }))
                setShowMapStylePanel(false)
              }}
              className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">Standard (nlmaps.nl)</div>
              <div className="text-sm text-gray-600">Official Dutch cartographic style</div>
            </button>
            
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('changeMapStyle', { detail: { style: 'satellite' } }))
                setShowMapStylePanel(false)
              }}
              className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">Satellite</div>
              <div className="text-sm text-gray-600">Global satellite imagery</div>
            </button>
            
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('changeMapStyle', { detail: { style: 'terrain' } }))
                setShowMapStylePanel(false)
              }}
              className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">Terrain</div>
              <div className="text-sm text-gray-600">Topographic terrain maps</div>
            </button>
          </div>
        </div>
      )}

      {/* Saved Routes Panel */}
      {showSavedRoutesPanel && (
        <div className="fixed top-20 right-4 z-50 bg-white rounded-xl shadow-2xl p-4 w-80 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Saved Routes</h3>
            <button
              onClick={() => setShowSavedRoutesPanel(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {savedRoutes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Save size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No saved routes yet</p>
                <p className="text-sm">Save your current route to access it later</p>
              </div>
            ) : (
              savedRoutes.map((route) => (
                <div key={route.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-gray-600">
                        {route.startPoint[0].toFixed(4)}, {route.startPoint[1].toFixed(4)} → {route.endPoint[0].toFixed(4)}, {route.endPoint[1].toFixed(4)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('loadSavedRoute', { detail: { route } }))
                          setShowSavedRoutesPanel(false)
                        }}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Load Route"
                      >
                        <Navigation size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${route.name}"?`)) {
                            // Remove from state
                            setSavedRoutes(prev => prev.filter(r => r.id !== route.id))
                            
                            // Remove from localStorage
                            try {
                              const savedRoutesKey = 'vaarpro_saved_routes'
                              const existingRoutes = JSON.parse(localStorage.getItem(savedRoutesKey) || '[]')
                              const updatedRoutes = existingRoutes.filter((r: any) => r.id !== route.id)
                              localStorage.setItem(savedRoutesKey, JSON.stringify(updatedRoutes))
                              console.log('✅ Route deleted successfully:', route.name)
                            } catch (error) {
                              console.error('❌ Failed to delete route from localStorage:', error)
                            }
                          }
                        }}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Delete Route"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {savedRoutes.length < 3 && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('saveCurrentRoute'))
                  setShowSavedRoutesPanel(false)
                }}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Save Current Route
              </button>
            )}
          </div>
        </div>
      )}

      {/* Boat Profile Panel */}
      {showBoatProfilePanel && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-br from-blue-600 to-cyan-600 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Boat Profile</h3>
            <button
              onClick={() => setShowBoatProfilePanel(false)}
              className="text-white hover:text-blue-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/20">
              <div>
                <div className="font-medium text-white text-base">Boat Length</div>
                <div className="text-sm text-blue-100">Length of your boat in meters</div>
              </div>
              <div className="ml-4 flex items-center">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.1"
                  className="w-24 p-3 border border-white/30 rounded-lg text-base bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/30"
                  value={settings.boatLength || ''}
                  onChange={(e) => updateSetting('boatLength', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                />
                <span className="text-base text-white ml-2 font-medium">m</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/20">
              <div>
                <div className="font-medium text-white text-base">Boat Width/Beam</div>
                <div className="text-sm text-blue-100">Width of your boat in meters</div>
              </div>
              <div className="ml-4 flex items-center">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.1"
                  className="w-24 p-3 border border-white/30 rounded-lg text-base bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/30"
                  value={settings.boatWidth || ''}
                  onChange={(e) => updateSetting('boatWidth', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                />
                <span className="text-base text-white ml-2 font-medium">m</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/20">
              <div>
                <div className="font-medium text-white text-base">Cruising Speed</div>
                <div className="text-sm text-blue-100">Your typical cruising speed for ETA calculations</div>
              </div>
              <div className="ml-4 flex items-center">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  className="w-24 p-3 border border-white/30 rounded-lg text-base bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/30"
                  value={settings.boatSpeed || ''}
                  onChange={(e) => updateSetting('boatSpeed', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                />
                <span className="text-base text-white ml-2 font-medium">km/h</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/20">
              <div>
                <div className="font-medium text-white text-base">Boat Height</div>
                <div className="text-sm text-blue-100">Height of your boat above waterline</div>
              </div>
              <div className="ml-4 flex items-center">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.1"
                  className="w-24 p-3 border border-white/30 rounded-lg text-base bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/30"
                  value={settings.boatHeight || ''}
                  onChange={(e) => updateSetting('boatHeight', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                />
                <span className="text-base text-white ml-2 font-medium">m</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-white text-base">Boat Draught</div>
                <div className="text-sm text-blue-100">Depth below waterline</div>
              </div>
              <div className="ml-4 flex items-center">
                <input
                  type="number"
                  min="0.5"
                  max="20"
                  step="0.1"
                  className="w-24 p-3 border border-white/30 rounded-lg text-base bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50 focus:border-white/50 focus:bg-white/30"
                  value={settings.boatDraught || ''}
                  onChange={(e) => updateSetting('boatDraught', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                />
                <span className="text-base text-white ml-2 font-medium">m</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Panel */}
      {showReportPanel && (
        <div className="fixed top-20 right-4 z-50 bg-gradient-to-br from-yellow-500 to-orange-500 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Report Issue</h3>
            <button
              onClick={() => {
                setShowReportPanel(false)
                setSelectedReportType(null)
              }}
              className="text-white hover:text-yellow-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          {!selectedReportType ? (
            <div className="space-y-3">
              <p className="text-white text-sm mb-4">Select the type of issue to report:</p>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedReportType('shallow_water')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">💧</div>
                  <div className="text-xs text-white font-medium">Shallow Water</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('bridge_closed')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🌉</div>
                  <div className="text-xs text-white font-medium">Bridge Closed</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('lock_closed')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🚦</div>
                  <div className="text-xs text-white font-medium">Lock Closed</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('obstruction')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🚧</div>
                  <div className="text-xs text-white font-medium">Obstruction</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('hazardous_navigation')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">⚠️</div>
                  <div className="text-xs text-white font-medium">Hazardous</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('speed_limit')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🚫</div>
                  <div className="text-xs text-white font-medium">Speed Limit</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('port_full')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">⚓</div>
                  <div className="text-xs text-white font-medium">Port Full</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('accident')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">🚨</div>
                  <div className="text-xs text-white font-medium">Accident</div>
                </button>
                
                <button
                  onClick={() => setSelectedReportType('police_checkpoint')}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-lg border border-white/30 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">👮</div>
                  <div className="text-xs text-white font-medium">Police</div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {selectedReportType === 'shallow_water' && '💧'}
                  {selectedReportType === 'bridge_closed' && '🌉'}
                  {selectedReportType === 'lock_closed' && '🚦'}
                  {selectedReportType === 'obstruction' && '🚧'}
                  {selectedReportType === 'hazardous_navigation' && '⚠️'}
                  {selectedReportType === 'speed_limit' && '🚫'}
                  {selectedReportType === 'port_full' && '⚓'}
                  {selectedReportType === 'accident' && '🚨'}
                  {selectedReportType === 'police_checkpoint' && '👮'}
                </div>
                <h4 className="text-white font-semibold text-lg">
                  {selectedReportType === 'shallow_water' && 'Shallow Water'}
                  {selectedReportType === 'bridge_closed' && 'Bridge Closed'}
                  {selectedReportType === 'lock_closed' && 'Lock Closed'}
                  {selectedReportType === 'obstruction' && 'Obstruction'}
                  {selectedReportType === 'hazardous_navigation' && 'Hazardous Navigation'}
                  {selectedReportType === 'speed_limit' && 'Speed Limit'}
                  {selectedReportType === 'port_full' && 'Port Full'}
                  {selectedReportType === 'accident' && 'Accident'}
                  {selectedReportType === 'police_checkpoint' && 'Police Checkpoint'}
                </h4>
                <p className="text-yellow-100 text-sm mt-2">Click on the map to add this report</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Dispatch event to enable map click mode for reporting
                    window.dispatchEvent(new CustomEvent('enableReportMode', { 
                      detail: { reportType: selectedReportType } 
                    }))
                    setShowReportPanel(false)
                  }}
                  className="flex-1 p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors border border-white/30"
                >
                  📍 Click on Map
                </button>
                <button
                  onClick={() => setSelectedReportType(null)}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default NavigationLayout
