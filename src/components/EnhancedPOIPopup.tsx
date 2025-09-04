import React, { useState } from 'react'
import { 
  Phone, 
  Globe, 
  Clock, 
  MapPin, 
  Anchor, 
  Ship, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Info,
  Navigation,
  Gauge,
  Users,
  Wifi,
  Fuel,
  Droplets,
  Zap,
  Wrench,
  Utensils,
  Car,
  Radio
} from 'lucide-react'
import { EnhancedPOIData, formatClearanceInfo, formatOperationalStatus, formatVesselPermissions, getPOITypeDisplayName, getPOITypeIcon } from '../utils/poiDataUtils'

interface EnhancedPOIPopupProps {
  poiData: EnhancedPOIData
  onClose?: () => void
}

const EnhancedPOIPopup: React.FC<EnhancedPOIPopupProps> = ({ poiData, onClose }) => {
  const [showAllInfo, setShowAllInfo] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const isSectionExpanded = (section: string) => expandedSections.has(section)

  const clearanceInfo = formatClearanceInfo(poiData.boatClearance)
  const operationalStatus = formatOperationalStatus(poiData.operationalInfo?.status)
  const vesselPermissions = formatVesselPermissions(poiData.operationalInfo)

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getPOITypeIcon(poiData.type)}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{poiData.name}</h3>
              <p className="text-sm text-gray-600">{getPOITypeDisplayName(poiData.type)}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Status Badge */}
        {poiData.operationalInfo?.status && (
          <div className="mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${operationalStatus.color} bg-gray-100`}>
              <div className={`w-2 h-2 rounded-full mr-1.5 ${operationalStatus.color.replace('text-', 'bg-')}`}></div>
              {operationalStatus.text}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Address */}
        {poiData.address && (
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-900">{poiData.address}</p>
              {poiData.waterway && (
                <p className="text-xs text-gray-600">On {poiData.waterway}</p>
              )}
            </div>
          </div>
        )}

        {/* Important Info - Boat Clearance */}
        {clearanceInfo.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-blue-900">Boat Clearance</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {clearanceInfo.map((info, index) => (
                <div key={index} className="text-xs text-blue-800">
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vessel Permissions */}
        {vesselPermissions.length > 0 && (
          <div className="flex items-start space-x-2">
            <Ship className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Vessel Types</p>
              <p className="text-xs text-gray-600">{vesselPermissions.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Opening Times */}
        {poiData.operationalInfo?.openingTimes && (
          <div className="flex items-start space-x-2">
            <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Opening Hours</p>
              <p className="text-xs text-gray-600">{poiData.operationalInfo.openingTimes}</p>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {poiData.contactInfo && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Contact Information</span>
            </h4>
            <div className="space-y-1">
              {poiData.contactInfo.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-3 h-3 text-gray-500" />
                  <a href={`tel:${poiData.contactInfo.phone}`} className="text-xs text-blue-600 hover:underline">
                    {poiData.contactInfo.phone}
                  </a>
                </div>
              )}
              {poiData.contactInfo.radioChannel && (
                <div className="flex items-center space-x-2">
                  <Radio className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-600">Channel {poiData.contactInfo.radioChannel}</span>
                </div>
              )}
              {poiData.contactInfo.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-3 h-3 text-gray-500" />
                  <a 
                    href={poiData.contactInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services */}
        {poiData.services && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <Anchor className="w-4 h-4" />
              <span>Services & Amenities</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {poiData.services.fuel && (
                <div className="flex items-center space-x-2">
                  <Fuel className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-gray-600">Fuel</span>
                </div>
              )}
              {poiData.services.water && (
                <div className="flex items-center space-x-2">
                  <Droplets className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-gray-600">Water</span>
                </div>
              )}
              {poiData.services.electricity && (
                <div className="flex items-center space-x-2">
                  <Zap className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs text-gray-600">Electricity</span>
                </div>
              )}
              {poiData.services.pumpOut && (
                <div className="flex items-center space-x-2">
                  <Wrench className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-600">Pump Out</span>
                </div>
              )}
              {poiData.services.restaurant && (
                <div className="flex items-center space-x-2">
                  <Utensils className="w-3 h-3 text-orange-600" />
                  <span className="text-xs text-gray-600">Restaurant</span>
                </div>
              )}
              {poiData.services.wifi && (
                <div className="flex items-center space-x-2">
                  <Wifi className="w-3 h-3 text-purple-600" />
                  <span className="text-xs text-gray-600">WiFi</span>
                </div>
              )}
              {poiData.services.parking && (
                <div className="flex items-center space-x-2">
                  <Car className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-600">Parking</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show All Information Button */}
        <button
          onClick={() => setShowAllInfo(!showAllInfo)}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>{showAllInfo ? 'Show Less' : 'Show All Information'}</span>
          {showAllInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expanded Information */}
        {showAllInfo && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            {/* Navigation Information */}
            {poiData.navigationInfo && (
              <div>
                <button
                  onClick={() => toggleSection('navigation')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-900"
                >
                  <span className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4" />
                    <span>Navigation Information</span>
                  </span>
                  {isSectionExpanded('navigation') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isSectionExpanded('navigation') && (
                  <div className="mt-2 space-y-2 text-xs text-gray-600">
                    {poiData.navigationInfo.depth && (
                      <div>Depth: {poiData.navigationInfo.depth}m</div>
                    )}
                    {poiData.navigationInfo.berthCount && (
                      <div>Berths: {poiData.navigationInfo.berthCount}</div>
                    )}
                    {poiData.navigationInfo.lockType && (
                      <div>Lock Type: {poiData.navigationInfo.lockType}</div>
                    )}
                    {poiData.navigationInfo.bridgeType && (
                      <div>Bridge Type: {poiData.navigationInfo.bridgeType}</div>
                    )}
                    {poiData.navigationInfo.navigationAids && (
                      <div>Navigation Aids: {poiData.navigationInfo.navigationAids.join(', ')}</div>
                    )}
                    {poiData.navigationInfo.hazards && (
                      <div className="text-red-600">
                        Hazards: {poiData.navigationInfo.hazards.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Additional Information */}
            {poiData.additionalInfo && (
              <div>
                <button
                  onClick={() => toggleSection('additional')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-900"
                >
                  <span className="flex items-center space-x-2">
                    <Info className="w-4 h-4" />
                    <span>Additional Information</span>
                  </span>
                  {isSectionExpanded('additional') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isSectionExpanded('additional') && (
                  <div className="mt-2 space-y-2 text-xs text-gray-600">
                    {poiData.additionalInfo.description && (
                      <div>{poiData.additionalInfo.description}</div>
                    )}
                    {poiData.additionalInfo.fees && (
                      <div>Fees: {poiData.additionalInfo.fees}</div>
                    )}
                    {poiData.additionalInfo.bookingRequired && (
                      <div className="text-orange-600">⚠️ Booking required</div>
                    )}
                    {poiData.additionalInfo.advanceNotice && (
                      <div>Advance Notice: {poiData.additionalInfo.advanceNotice}</div>
                    )}
                    {poiData.additionalInfo.restrictions && (
                      <div className="text-red-600">
                        Restrictions: {poiData.additionalInfo.restrictions.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* External Links */}
            {poiData.externalLinks && (
              <div>
                <button
                  onClick={() => toggleSection('links')}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-900"
                >
                  <span className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>External Links</span>
                  </span>
                  {isSectionExpanded('links') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isSectionExpanded('links') && (
                  <div className="mt-2 space-y-2">
                    {poiData.externalLinks.bookingSystem && (
                      <a 
                        href={poiData.externalLinks.bookingSystem}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Booking System</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {poiData.externalLinks.liveStatus && (
                      <a 
                        href={poiData.externalLinks.liveStatus}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Live Status</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {poiData.externalLinks.weatherInfo && (
                      <a 
                        href={poiData.externalLinks.weatherInfo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Weather Information</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Data Confidence */}
            <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between">
                <span>Data Confidence: {poiData.confidence}</span>
                <span>Source: {poiData.dataSource}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedPOIPopup
