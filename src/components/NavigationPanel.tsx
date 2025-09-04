import React, { useState } from 'react'
import { MapPin, Clock, Navigation, X, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { POI, RoutePOIs, formatDistance, formatTime, getPOIIcon, getPOIColor } from '../utils/poiUtils'

interface NavigationPanelProps {
  routePOIs: RoutePOIs | null
  isVisible: boolean
  onClose: () => void
  onPOIClick: (poi: POI) => void
  currentSpeed: number
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  routePOIs,
  isVisible,
  onClose,
  onPOIClick,
  currentSpeed
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)

  if (!isVisible || !routePOIs) return null

  const handlePOIClick = (poi: POI) => {
    setSelectedPOI(poi)
    onPOIClick(poi)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-[9999] bg-white rounded-t-2xl shadow-2xl border border-gray-200 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation size={24} />
            <div>
              <h3 className="text-lg font-semibold">Navigation Route</h3>
              <div className="text-sm text-blue-100">
                {formatDistance(routePOIs.totalDistance)} • {formatTime(routePOIs.totalTime)} • {currentSpeed} knots
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleExpanded}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* POI List */}
      <div className={`bg-white transition-all duration-300 ${isExpanded ? 'max-h-80' : 'max-h-48'}`}>
        <div className="overflow-y-auto max-h-full">
          {routePOIs.pois.map((poi, index) => (
            <div
              key={poi.id}
              className={`border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedPOI?.id === poi.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => handlePOIClick(poi)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* POI Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                    {getPOIIcon(poi)}
                  </div>
                  
                  {/* POI Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{poi.name}</h4>
                      {poi.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          poi.status === 'closed' 
                            ? 'bg-red-100 text-red-700' 
                            : poi.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {poi.status}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{poi.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{formatDistance(poi.distance)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatTime(poi.estimatedTime)}</span>
                      </div>
                      {poi.waterway && (
                        <span className="text-blue-600 font-medium">{poi.waterway}</span>
                      )}
                    </div>
                    
                    {/* Additional POI-specific info */}
                    {poi.type === 'bridge' && poi.height && (
                      <div className="mt-2 text-xs text-gray-500">
                        Max height: {poi.height}m
                      </div>
                    )}
                    {poi.type === 'lock' && poi.width && (
                      <div className="mt-2 text-xs text-gray-500">
                        Lock width: {poi.width}m
                      </div>
                    )}
                    {poi.type === 'harbor' && poi.depth && (
                      <div className="mt-2 text-xs text-gray-500">
                        Depth: {poi.depth}m
                      </div>
                    )}
                    {poi.type === 'marina' && poi.depth && (
                      <div className="mt-2 text-xs text-gray-500">
                        Depth: {poi.depth}m
                      </div>
                    )}
                  </div>
                  
                  {/* Distance indicator */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDistance(poi.distance)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(poi.estimatedTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Summary */}
      <div className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Total: {routePOIs.pois.length} waypoints
            </span>
            <span className="text-gray-600">
              {routePOIs.pois.filter(p => p.type === 'lock').length} locks
            </span>
            <span className="text-gray-600">
              {routePOIs.pois.filter(p => p.type === 'bridge').length} bridges
            </span>
            <span className="text-gray-600">
              {routePOIs.pois.filter(p => p.type === 'harbor' || p.type === 'marina').length} harbors
            </span>
            <span className="text-gray-600">
              {routePOIs.pois.filter(p => ['buoy', 'beacon', 'light'].includes(p.type)).length} nav aids
            </span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {formatDistance(routePOIs.totalDistance)}
            </div>
            <div className="text-gray-600">
              ETA: {formatTime(routePOIs.totalTime)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NavigationPanel
