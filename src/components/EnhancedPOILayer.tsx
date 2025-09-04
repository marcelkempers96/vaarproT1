import React, { useEffect } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { extractEnhancedPOIData } from '../utils/poiDataUtils'
import { POI } from '../utils/poiUtils'

interface EnhancedPOILayerProps {
  data: any
  poiType: 'lock' | 'bridge' | 'harbor' | 'marina' | 'gas_station' | 'buoy'
}

// Helper function to clean up POI names
const cleanPOIName = (name: string, type: string, id: string): string => {
  if (!name) {
    return `${type.charAt(0).toUpperCase() + type.slice(1)} ${id}`
  }
  
  // Remove long generic names with numbers at the end
  const genericPatterns = [
    /^(Marine|Buoy|Lock|Bridge|Harbor|Marina|Fuel)\s+\d+$/i,
    /^(Marine|Buoy|Lock|Bridge|Harbor|Marina|Fuel)\s+\d{6,}$/i,
    /^(Marine|Buoy|Lock|Bridge|Harbor|Marina|Fuel)\s+\d{4,}$/i,
    /^(Marine|Buoy|Lock|Bridge|Harbor|Marina|Fuel)\s+\d{3,}$/i
  ]
  
  for (const pattern of genericPatterns) {
    if (pattern.test(name)) {
      return `${type.charAt(0).toUpperCase() + type.slice(1)} ${id}`
    }
  }
  
  // Remove numbers at the end of names
  const cleanedName = name.replace(/\s+\d+$/, '')
  
  // If the cleaned name is too short or generic, use the type + id
  if (cleanedName.length < 3 || /^(Marine|Buoy|Lock|Bridge|Harbor|Marina|Fuel)$/i.test(cleanedName)) {
    return `${type.charAt(0).toUpperCase() + type.slice(1)} ${id}`
  }
  
  return cleanedName
}

const EnhancedPOILayer: React.FC<EnhancedPOILayerProps> = ({ data, poiType }) => {
  const map = useMap()

  useEffect(() => {
    if (data && data.elements) {
      const layer = L.layerGroup()
      
      for (const el of data.elements) {
        let shouldInclude = false
        
        // Determine if this element should be included based on type
        switch (poiType) {
          case 'lock':
            shouldInclude = (el.type === 'node' && el.tags?.waterway === 'lock_gate') || 
                           (el.type === 'way' && el.tags?.waterway === 'lock_gate') ||
                           (el.type === 'node' && el.tags?.lock === 'yes') ||
                           (el.type === 'way' && el.tags?.lock === 'yes') ||
                           (el.type === 'node' && el.tags?.waterway === 'lock') ||
                           (el.type === 'way' && el.tags?.waterway === 'lock')
            break
          case 'bridge':
            shouldInclude = el.tags?.bridge
            break
          case 'harbor':
            shouldInclude = (el.type === 'node' && el.tags?.harbour) || 
                           (el.type === 'way' && el.tags?.harbour) ||
                           (el.type === 'node' && el.tags?.['seamark:type'] === 'harbour') ||
                           (el.type === 'node' && el.tags?.seamark_type === 'harbour')
            break
          case 'marina':
            shouldInclude = (el.type === 'node' && el.tags?.leisure === 'marina') || 
                           (el.type === 'way' && el.tags?.leisure === 'marina') ||
                           (el.type === 'node' && el.tags?.['seamark:harbour:category']?.includes('marina')) ||
                           (el.type === 'node' && el.tags?.['seamark:harbour:category']?.includes('yacht_harbour')) ||
                           (el.type === 'node' && el.tags?.mooring === 'yes') ||
                           (el.type === 'way' && el.tags?.mooring === 'yes') ||
                           (el.type === 'node' && el.tags?.['seamark:type'] === 'pontoon')
            break
          case 'gas_station':
            shouldInclude = (el.type === 'node' && el.tags?.amenity === 'fuel') || 
                           (el.type === 'way' && el.tags?.amenity === 'fuel') ||
                           (el.type === 'node' && el.tags?.['seamark:type'] === 'fuel') ||
                           (el.type === 'node' && el.tags?.fuel) ||
                           (el.type === 'way' && el.tags?.fuel) ||
                           (el.type === 'node' && el.tags?.['seamark:fuel:type'])
            break
          case 'buoy':
            shouldInclude = el.tags?.['seamark:type'] === 'buoy' ||
                           el.tags?.['seamark:type'] === 'beacon' ||
                           el.tags?.['seamark:type'] === 'light' ||
                           el.tags?.['seamark:type'] === 'marker' ||
                           el.tags?.['seamark:type'] === 'daymark' ||
                           el.tags?.['seamark:type'] === 'nightmark' ||
                           el.tags?.['seamark:type'] === 'cardinal' ||
                           el.tags?.['seamark:type'] === 'lateral' ||
                           el.tags?.['seamark:type'] === 'safe_water' ||
                           el.tags?.['seamark:type'] === 'isolated_danger' ||
                           el.tags?.['seamark:type'] === 'special_purpose' ||
                           el.tags?.['seamark:type'] === 'landmark' ||
                           el.tags?.['seamark:type'] === 'notice' ||
                           el.tags?.['seamark:type'] === 'pilot_boarding' ||
                           el.tags?.['seamark:type'] === 'anchorage' ||
                           el.tags?.['seamark:type'] === 'mooring' ||
                           el.tags?.['seamark:type'] === 'lighthouse' ||
                           el.tags?.['seamark:type'] === 'light_vessel' ||
                           el.tags?.['seamark:type'] === 'fog_signal' ||
                           el.tags?.['seamark:type'] === 'radio_beacon' ||
                           el.tags?.['seamark:type'] === 'radar_transponder' ||
                           el.tags?.['seamark:type'] === 'ais' ||
                           el.tags?.['seamark:type'] === 'vts'
            break
        }
        
        if (shouldInclude) {
          let lat, lon
          if (el.type === 'node') { 
            lat = el.lat; 
            lon = el.lon 
          } else if (el.type === 'way' && el.center) { 
            lat = el.center.lat; 
            lon = el.center.lon 
          } else continue
          
          // Determine actual POI type for harbors/marinas
          let actualType = poiType
          if (poiType === 'harbor') {
            // Check if it's actually a marina
            if (el.tags?.leisure === 'marina' || 
                el.tags?.['seamark:harbour:category']?.includes('marina') ||
                el.tags?.['seamark:harbour:category']?.includes('yacht_harbour') ||
                el.tags?.mooring === 'yes' ||
                el.tags?.['seamark:type'] === 'pontoon') {
              actualType = 'marina'
            }
          }
          
          // Create POI object
          const poi: POI = {
            id: `${actualType}_${el.id}`,
            type: actualType as 'lock' | 'bridge' | 'harbor' | 'marina' | 'gas_station' | 'buoy',
            name: cleanPOIName(el.tags?.name || '', actualType, el.id),
            description: el.tags?.description || `${actualType.charAt(0).toUpperCase() + actualType.slice(1)}`,
            coordinates: [lat, lon],
            distance: 0,
            estimatedTime: 0,
            icon: getPOIIcon(actualType),
            tags: el.tags,
            waterway: el.tags?.waterway
          }
          
          // Check if this is a named POI (not generic)
          const isNamedPOI = el.tags?.name && 
            !el.tags.name.match(/^(lock|bridge|harbor|marina|gas station)\s*\d+$/i) &&
            !el.tags.name.match(/^\d+$/) &&
            el.tags.name.length > 3
          
          // Get appropriate icon
          const iconEmoji = getPOIIcon(actualType)
          const iconColor = getPOIColor(actualType)
          
          // Create icon with appropriate styling - make named POIs larger
          const baseSize = isNamedPOI ? 32 : 24
          const fontSize = isNamedPOI ? 18 : 14
          const borderWidth = isNamedPOI ? 3 : 2
          const shadowIntensity = isNamedPOI ? '0 4px 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.3)'
          
          let iconHtml = iconEmoji
          if (actualType === 'harbor') {
            // Harbor uses anchor emoji in white circle
            iconHtml = `<div style="
              width: ${baseSize}px; 
              height: ${baseSize}px; 
              background: white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: ${fontSize}px;
              box-shadow: ${shadowIntensity};
              ${isNamedPOI ? 'border: 2px solid #3B82F6;' : ''}
            ">${iconHtml}</div>`
          } else if (actualType === 'marina') {
            // Marina uses anchor emoji in blue circle with white border
            iconHtml = `<div style="
              width: ${baseSize}px; 
              height: ${baseSize}px; 
              background: #3B82F6; 
              border: ${borderWidth}px solid white;
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: ${fontSize}px;
              box-shadow: ${shadowIntensity};
            ">${iconHtml}</div>`
          } else if (actualType === 'lock') {
            // Lock uses traffic light emoji in bright yellow circle with white border
            iconHtml = `<div style="
              width: ${baseSize}px; 
              height: ${baseSize}px; 
              background: #fbbf24; 
              border: ${borderWidth}px solid white;
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: ${fontSize}px;
              box-shadow: ${shadowIntensity};
              ${isNamedPOI ? 'border-color: #f59e0b;' : ''}
            ">${iconHtml}</div>`
          } else if (actualType === 'bridge') {
            // Bridge uses simple green circle with white border (no emoji)
            iconHtml = `<div style="
              width: ${baseSize}px; 
              height: ${baseSize}px; 
              background: #10B981; 
              border: ${borderWidth}px solid white;
              border-radius: 50%; 
              box-shadow: ${shadowIntensity};
              ${isNamedPOI ? 'border-color: #059669;' : ''}
            "></div>`
          } else if (actualType === 'gas_station') {
            // Gas station uses fuel emoji in red circle with white border
            iconHtml = `<div style="
              width: ${baseSize}px; 
              height: ${baseSize}px; 
              background: #ef4444; 
              border: ${borderWidth}px solid white;
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: ${fontSize}px;
              box-shadow: ${shadowIntensity};
            ">${iconHtml}</div>`
          } else if (actualType === 'buoy') {
            // Buoy uses yellow circle emoji in yellow circle with white border
            iconHtml = `<div style="
              width: ${baseSize}px; 
              height: ${baseSize}px; 
              background: #fbbf24; 
              border: ${borderWidth}px solid white;
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: ${fontSize}px;
              box-shadow: ${shadowIntensity};
              ${isNamedPOI ? 'border-color: #f59e0b;' : ''}
            ">${iconHtml}</div>`
          } else {
            iconHtml = `<div style="font-size:${fontSize}px;line-height:${fontSize}px;color:${iconColor};">${iconHtml}</div>`
          }

                    const marker = L.marker([lat, lon], { 
            icon: L.divIcon({ 
              className: 'custom-poi-marker', 
              html: iconHtml, 
              iconSize: [baseSize, baseSize], 
              iconAnchor: [baseSize / 2, baseSize / 2]
            }),
            zIndexOffset: 1000 // Higher than waterways but lower than route
          })
          
          // Create enhanced popup content
          const enhancedData = extractEnhancedPOIData(poi, el)
          
          // Debug: Log the enhanced data to see what's being extracted
          console.log(`Enhanced data for ${actualType} ${poi.name}:`, enhancedData)
          console.log(`Original tags:`, el.tags)
          
          const popupContent = createPopupHTML(enhancedData, iconEmoji, actualType)
          
          marker.bindPopup(popupContent, {
            maxWidth: 400,
            minWidth: 300,
            className: 'enhanced-poi-popup'
          })
          
          layer.addLayer(marker)
        }
      }
      
      layer.addTo(map)
      
      return () => {
        map.removeLayer(layer)
      }
    }
  }, [data, map, poiType])

  return null
}

// Helper function to get POI icon
const getPOIIcon = (type: string): string => {
  switch (type) {
    case 'lock': return '🚦'
    case 'bridge': return '🌉'
    case 'harbor': return '⚓'
    case 'marina': return '⚓'
    case 'gas_station': return '⛽'
    case 'buoy': return '🟡'
    default: return '📍'
  }
}

// Helper function to get POI color
const getPOIColor = (type: string): string => {
  switch (type) {
    case 'lock': return '#3B82F6'
    case 'bridge': return '#10B981'
    case 'harbor': return '#8B5CF6'
    case 'marina': return '#F59E0B'
    case 'gas_station': return '#EF4444'
    case 'buoy': return '#FBBF24'
    default: return '#6B7280'
  }
}

// Create HTML content for popup
const createPopupHTML = (enhancedData: any, iconEmoji: string, actualType: string): string => {
  const clearanceInfo = enhancedData.boatClearance ? formatClearanceInfo(enhancedData.boatClearance) : []
  const operationalStatus = enhancedData.operationalInfo?.status || 'unknown'
  const statusColor = operationalStatus === 'open' ? '#10B981' : operationalStatus === 'closed' ? '#EF4444' : '#6B7280'
  
  // Debug: Log what's being processed
  console.log(`Creating popup for ${actualType}:`, {
    clearanceInfo,
    boatClearance: enhancedData.boatClearance,
    navigationInfo: enhancedData.navigationInfo,
    additionalInfo: enhancedData.additionalInfo
  })
  
  return `
    <div style="min-width: 300px; max-width: 400px; font-family: system-ui, -apple-system, sans-serif;">
      <!-- Header -->
      <div style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">${actualType === 'bridge' ? '<img src="/bridge.png" style="width: 24px; height: 24px;" alt="Bridge" />' : iconEmoji}</div>
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">${enhancedData.name}</h3>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #6B7280;">${enhancedData.type.charAt(0).toUpperCase() + enhancedData.type.slice(1)}</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 12px; background-color: #F3F4F6;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></div>
            <span style="font-size: 12px; font-weight: 500; color: ${statusColor};">${operationalStatus.charAt(0).toUpperCase() + operationalStatus.slice(1)}</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div style="padding: 16px;">
        ${enhancedData.address ? `
          <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px;">
            <div style="color: #6B7280; margin-top: 2px;">📍</div>
            <div>
              <p style="margin: 0; font-size: 14px; color: #111827;">${enhancedData.address}</p>
              ${enhancedData.waterway ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">On ${enhancedData.waterway}</p>` : ''}
            </div>
          </div>
        ` : ''}

        ${clearanceInfo.length > 0 ? `
          <div style="background-color: #EFF6FF; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="color: #3B82F6;">🧭</div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1E40AF;">
                ${actualType === 'lock' ? 'Lock Clearance & Draught' : actualType === 'bridge' ? 'Bridge Clearance' : 'Boat Clearance'}
              </h4>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              ${clearanceInfo.map(info => {
                // Highlight draught information for locks and bridges
                const isDraughtInfo = info.toLowerCase().includes('draft') || info.toLowerCase().includes('draught')
                const isImportantInfo = isDraughtInfo || info.toLowerCase().includes('height') || info.toLowerCase().includes('width')
                const highlightStyle = (actualType === 'lock' || actualType === 'bridge') && isImportantInfo ? 
                  'font-weight: 600; color: #1E3A8A; background-color: #DBEAFE; padding: 2px 4px; border-radius: 4px;' : 
                  'font-size: 12px; color: #1E40AF;'
                return `<div style="${highlightStyle}">${info}</div>`
              }).join('')}
            </div>
          </div>
        ` : ''}

        ${enhancedData.operationalInfo?.openingTimes ? `
          <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 16px;">
            <div style="color: #6B7280; margin-top: 2px;">🕐</div>
            <div>
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">Opening Hours</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">${enhancedData.operationalInfo.openingTimes}</p>
            </div>
          </div>
        ` : ''}

        ${enhancedData.contactInfo ? `
          <div style="background-color: #F0F9FF; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="color: #3B82F6;">📞</div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1E40AF;">Contact Information</h4>
            </div>
            <div style="display: grid; gap: 6px;">
              ${enhancedData.contactInfo.phone ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #6B7280; font-size: 12px;">📞</span>
                  <a href="tel:${enhancedData.contactInfo.phone}" style="font-size: 12px; color: #3B82F6; text-decoration: none;">${enhancedData.contactInfo.phone}</a>
                </div>
              ` : ''}
              ${enhancedData.contactInfo.email ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #6B7280; font-size: 12px;">✉️</span>
                  <a href="mailto:${enhancedData.contactInfo.email}" style="font-size: 12px; color: #3B82F6; text-decoration: none;">${enhancedData.contactInfo.email}</a>
                </div>
              ` : ''}
              ${enhancedData.contactInfo.website ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #6B7280; font-size: 12px;">🌐</span>
                  <a href="${enhancedData.contactInfo.website}" target="_blank" style="font-size: 12px; color: #3B82F6; text-decoration: none;">Visit Website</a>
                </div>
              ` : ''}
              ${enhancedData.contactInfo.radioChannel ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #6B7280; font-size: 12px;">📻</span>
                  <span style="font-size: 12px; color: #374151;">VHF ${enhancedData.contactInfo.radioChannel}</span>
                </div>
              ` : ''}
              ${enhancedData.contactInfo.emergencyContact ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #6B7280; font-size: 12px;">🚨</span>
                  <a href="tel:${enhancedData.contactInfo.emergencyContact}" style="font-size: 12px; color: #EF4444; text-decoration: none;">Emergency: ${enhancedData.contactInfo.emergencyContact}</a>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 16px;">
          <button onclick="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                  style="width: 100%; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; background-color: white; color: #374151; font-size: 14px; cursor: pointer;">
            Show All Information
          </button>
          <div style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
            ${createAdditionalInfoHTML(enhancedData)}
            ${createAllAvailableDataHTML(enhancedData)}
          </div>
        </div>
      </div>
    </div>
  `
}

// Create additional information HTML
const createAdditionalInfoHTML = (enhancedData: any): string => {
  let html = ''
  
  // Navigation Information
  if (enhancedData.navigationInfo) {
    html += `
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">🧭 Navigation Information</h4>
        <div style="font-size: 12px; color: #6B7280; line-height: 1.4;">
          ${enhancedData.navigationInfo.depth ? `<div>Depth: ${enhancedData.navigationInfo.depth}m</div>` : ''}
          ${enhancedData.navigationInfo.approachDepth ? `<div>Approach Depth: ${enhancedData.navigationInfo.approachDepth}m</div>` : ''}
          ${enhancedData.navigationInfo.berthCount ? `<div>Berths: ${enhancedData.navigationInfo.berthCount}</div>` : ''}
          ${enhancedData.navigationInfo.maxVesselLength ? `<div>Max Vessel Length: ${enhancedData.navigationInfo.maxVesselLength}m</div>` : ''}
          ${enhancedData.navigationInfo.lockType ? `<div>Lock Type: ${enhancedData.navigationInfo.lockType}</div>` : ''}
          ${enhancedData.navigationInfo.bridgeType ? `<div>Bridge Type: ${enhancedData.navigationInfo.bridgeType}</div>` : ''}
          ${enhancedData.navigationInfo.navigationAids && enhancedData.navigationInfo.navigationAids.length > 0 ? 
            `<div>Navigation Aids: ${enhancedData.navigationInfo.navigationAids.join(', ')}</div>` : ''}
          ${enhancedData.navigationInfo.hazards && enhancedData.navigationInfo.hazards.length > 0 ? 
            `<div style="color: #DC2626;">⚠️ Hazards: ${enhancedData.navigationInfo.hazards.join(', ')}</div>` : ''}
        </div>
      </div>
    `
  }
  
  // Services
  if (enhancedData.services) {
    const services = []
    if (enhancedData.services.fuel) services.push('⛽ Fuel')
    if (enhancedData.services.water) services.push('💧 Water')
    if (enhancedData.services.electricity) services.push('⚡ Electricity')
    if (enhancedData.services.wifi) services.push('📶 WiFi')
    if (enhancedData.services.restaurant) services.push('🍽️ Restaurant')
    
    if (services.length > 0) {
      html += `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">⚓ Services</h4>
          <div style="font-size: 12px; color: #6B7280;">${services.join(', ')}</div>
        </div>
      `
    }
  }
  
  // Additional Information - Comprehensive display
  if (enhancedData.additionalInfo) {
    html += `
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">ℹ️ Additional Information</h4>
        <div style="font-size: 12px; color: #6B7280; line-height: 1.4;">
          ${enhancedData.additionalInfo.description ? `<div style="margin-bottom: 8px; padding: 8px; background-color: #F9FAFB; border-radius: 4px; border-left: 3px solid #3B82F6;">${enhancedData.additionalInfo.description}</div>` : ''}
          ${enhancedData.additionalInfo.history ? `<div style="margin-bottom: 4px;"><strong>History:</strong> ${enhancedData.additionalInfo.history}</div>` : ''}
          ${enhancedData.additionalInfo.fees ? `<div style="margin-bottom: 4px;"><strong>Fees:</strong> ${enhancedData.additionalInfo.fees}</div>` : ''}
          ${enhancedData.additionalInfo.bookingRequired ? `<div style="margin-bottom: 4px; color: #DC2626;"><strong>⚠️ Booking Required:</strong> Yes</div>` : ''}
          ${enhancedData.additionalInfo.advanceNotice ? `<div style="margin-bottom: 4px; color: #D97706;"><strong>⏰ Advance Notice:</strong> ${enhancedData.additionalInfo.advanceNotice}</div>` : ''}
          ${enhancedData.additionalInfo.weatherDependent ? `<div style="margin-bottom: 4px; color: #059669;"><strong>🌤️ Weather Dependent:</strong> Yes</div>` : ''}
          ${enhancedData.additionalInfo.restrictions && enhancedData.additionalInfo.restrictions.length > 0 ? `
            <div style="margin-bottom: 4px; padding: 6px; background-color: #FEF2F2; border-radius: 4px; border-left: 3px solid #DC2626;">
              <strong style="color: #DC2626;">🚫 Restrictions:</strong><br/>
              ${enhancedData.additionalInfo.restrictions.map((r: string) => `• ${r}`).join('<br/>')}
            </div>
          ` : ''}
        </div>
      </div>
    `
  }
  
  // External Links
  if (enhancedData.externalLinks) {
    const links = []
    if (enhancedData.externalLinks.officialWebsite) links.push(`<a href="${enhancedData.externalLinks.officialWebsite}" target="_blank" style="color: #3B82F6; text-decoration: none;">Official Website</a>`)
    if (enhancedData.externalLinks.bookingSystem) links.push(`<a href="${enhancedData.externalLinks.bookingSystem}" target="_blank" style="color: #3B82F6; text-decoration: none;">Booking System</a>`)
    if (enhancedData.externalLinks.liveStatus) links.push(`<a href="${enhancedData.externalLinks.liveStatus}" target="_blank" style="color: #3B82F6; text-decoration: none;">Live Status</a>`)
    if (enhancedData.externalLinks.weatherInfo) links.push(`<a href="${enhancedData.externalLinks.weatherInfo}" target="_blank" style="color: #3B82F6; text-decoration: none;">Weather Info</a>`)
    if (enhancedData.externalLinks.tideInfo) links.push(`<a href="${enhancedData.externalLinks.tideInfo}" target="_blank" style="color: #3B82F6; text-decoration: none;">Tide Info</a>`)
    
    if (links.length > 0) {
      html += `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">🔗 External Links</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px;">
            ${links.join(' • ')}
          </div>
        </div>
      `
    }
  }
  
  return html
}

// Create comprehensive "All Available Data" section
const createAllAvailableDataHTML = (enhancedData: any): string => {
  if (!enhancedData.tags || typeof enhancedData.tags !== 'object') {
    return ''
  }
  
  const tags = enhancedData.tags
  const excludedTags = new Set([
    'name', 'description', 'type', 'id', 'lat', 'lon', 'center', 'geometry',
    'waterway', 'bridge', 'lock', 'amenity', 'leisure', 'tourism', 'seamark:type',
    'addr:housenumber', 'addr:street', 'addr:city', 'addr:postcode', 'addr:country',
    'phone', 'email', 'website', 'url', 'opening_hours', 'status'
  ])
  
  const remainingTags = Object.entries(tags)
    .filter(([key, value]) => !excludedTags.has(key) && value && value !== 'no' && value !== 'false')
    .sort(([a], [b]) => a.localeCompare(b))
  
  if (remainingTags.length === 0) {
    return ''
  }
  
  return `
    <div style="margin-bottom: 16px;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">📋 All Available Data</h4>
      <div style="font-size: 11px; color: #6B7280; line-height: 1.3; max-height: 200px; overflow-y: auto; background-color: #F9FAFB; padding: 8px; border-radius: 4px; border: 1px solid #E5E7EB;">
        ${remainingTags.map(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          const formattedValue = typeof value === 'string' ? value : String(value)
          return `<div style="margin-bottom: 2px;"><strong>${formattedKey}:</strong> ${formattedValue}</div>`
        }).join('')}
      </div>
    </div>
  `
}

// Helper function to format clearance info - comprehensive version
const formatClearanceInfo = (clearance: any): string[] => {
  const info: string[] = []
  
  if (clearance?.height) {
    info.push(`Height: ${clearance.height}m`)
  }
  if (clearance?.width) {
    info.push(`Width: ${clearance.width}m`)
  }
  if (clearance?.maxLength) {
    info.push(`Max Length: ${clearance.maxLength}m`)
  }
  if (clearance?.maxDraft) {
    info.push(`Max Draft: ${clearance.maxDraft}m`)
  }
  if (clearance?.maxDisplacement) {
    info.push(`Max Displacement: ${clearance.maxDisplacement.toFixed(0)}t`)
  }
  
  return info
}

export default EnhancedPOILayer
