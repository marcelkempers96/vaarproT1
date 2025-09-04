// POI (Points of Interest) utilities for VaarApp
// Handles extraction, organization, and display of POIs along navigation routes

export interface POI {
  id: string
  type: 'lock' | 'bridge' | 'harbor' | 'marina' | 'gas_station' | 'report' | 'waypoint' | 'buoy' | 'beacon' | 'light' | 'anchorage'
  name: string
  description: string
  coordinates: [number, number] // [lat, lng]
  distance: number // Distance from start of route in meters
  estimatedTime: number // Estimated arrival time in minutes
  icon: string // Emoji or icon representation
  tags?: Record<string, string> // Additional metadata
  waterway?: string // Associated waterway name
  height?: number // For bridges
  width?: number // For locks
  status?: 'open' | 'closed' | 'unknown' // For locks and bridges
  depth?: number // For harbors and anchorages
  severity?: 'low' | 'medium' | 'high' | 'critical' // For reports
  reportType?: string // Type of report (shallow_water, bridge_closed, etc.)
}

export interface RoutePOIs {
  pois: POI[]
  totalDistance: number
  totalTime: number
  startPoint: [number, number]
  endPoint: [number, number]
}

// Bridge height data cache
const bridgeHeightCache = new Map<string, number>()

// Fetch bridge height from external source
const fetchBridgeHeight = async (bridgeId: string, _bridgeName: string): Promise<number | null> => {
  // Check cache first
  if (bridgeHeightCache.has(bridgeId)) {
    return bridgeHeightCache.get(bridgeId)!
  }

  try {
    // Try to fetch from vaarweginformatie.nl or similar source
    // For now, we'll use a mock implementation that returns reasonable heights
    // In a real implementation, you would make an API call here
    const mockHeights = [3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0, 9.0, 10.0]
    const height = mockHeights[Math.floor(Math.random() * mockHeights.length)]
    
    bridgeHeightCache.set(bridgeId, height)
    return height
  } catch (error) {
    console.warn(`Failed to fetch height for bridge ${bridgeId}:`, error)
    return null
  }
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

// Extract POIs from route coordinates and map data
export const extractRoutePOIs = (
  routeCoordinates: [number, number][],
  locksData: any,
  bridgesData: any,
  docksData: any,
  startPoint: [number, number],
  endPoint: [number, number],
  gasStationsData?: any,
  buoysData?: any,
  reportsData?: any // Add reports data parameter
): RoutePOIs => {
  const pois: POI[] = []
  let totalDistance = 0
  
  // Add start waypoint
  pois.push({
    id: 'start',
    type: 'waypoint',
    name: 'Start Point',
    description: 'Navigation starting point',
    coordinates: startPoint,
    distance: 0,
    estimatedTime: 0,
    icon: '📍',
    waterway: 'Route Start'
  })
  
  // Process route coordinates to find POIs
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const currentCoord = routeCoordinates[i]
    const nextCoord = routeCoordinates[i + 1]
    
    // Calculate segment distance
    const segmentDistance = haversine(currentCoord, nextCoord)
    totalDistance += segmentDistance
    
    // Check for POIs near this route segment
    const poisInSegment = findPOIsNearSegment(
      currentCoord,
      nextCoord,
      locksData,
      bridgesData,
      docksData,
      gasStationsData,
      buoysData,
      reportsData,
      totalDistance
    )
    
    pois.push(...poisInSegment)
  }
  
  // Add end waypoint
  pois.push({
    id: 'end',
    type: 'waypoint',
    name: 'Destination',
    description: 'Navigation destination point',
    coordinates: endPoint,
    distance: totalDistance,
    estimatedTime: Math.round(totalDistance / (8.5 * 0.514)), // Convert to minutes at 8.5 knots
    icon: '🎯',
    waterway: 'Route End'
  })
  
  // Sort POIs by distance from start
  pois.sort((a, b) => a.distance - b.distance)
  
  // Calculate estimated times for all POIs
  const speedMps = 8.5 * 0.514 // Convert knots to meters per second
  pois.forEach(poi => {
    poi.estimatedTime = Math.round(poi.distance / speedMps / 60) // Convert to minutes
  })
  
  return {
    pois,
    totalDistance,
    totalTime: Math.round(totalDistance / speedMps / 60),
    startPoint,
    endPoint
  }
}

// Find POIs near a route segment
const findPOIsNearSegment = (
  startCoord: [number, number],
  endCoord: [number, number],
  locksData: any,
  bridgesData: any,
  docksData: any,
  gasStationsData: any,
  buoysData: any,
  reportsData: any,
  accumulatedDistance: number
): POI[] => {
  const pois: POI[] = []
  
  // Check locks
  if (locksData?.elements) {
    locksData.elements.forEach((lock: any) => {
      if (isPOINearSegment(lock, startCoord, endCoord, 50)) { // 50m tolerance
        const lockCoord = getPOICoordinates(lock)
        if (lockCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, lockCoord)
          pois.push({
            id: `lock_${lock.id}`,
            type: 'lock',
            name: cleanPOIName(lock.tags?.name || '', 'lock', lock.id),
            description: `Waterway lock${lock.tags?.lock_type ? ` (${lock.tags.lock_type})` : ''}`,
            coordinates: lockCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: '🚦',
            tags: {
              ...lock.tags,
              // Add default contact information if not present
              website: lock.tags?.website || 'https://vaarweginformatie.nl',
              contact: lock.tags?.contact || lock.tags?.phone || 'Contact via vaarweginformatie.nl'
            },
            waterway: lock.tags?.waterway || 'Unknown',
            width: lock.tags?.width ? parseFloat(lock.tags.width) : undefined,
            status: getLockStatus(lock.tags)
          })
        }
      }
    })
  }
  
  // Check bridges
  if (bridgesData?.elements) {
    bridgesData.elements.forEach((bridge: any) => {
      if (isPOINearSegment(bridge, startCoord, endCoord, 50)) { // 50m tolerance
        const bridgeCoord = getPOICoordinates(bridge)
        if (bridgeCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, bridgeCoord)
          
          // Get height from tags or fetch from external source
          let height = bridge.tags?.maxheight ? parseFloat(bridge.tags.maxheight) : undefined
          if (!height) {
            // Try to get height from external source
            fetchBridgeHeight(bridge.id, bridge.tags?.name || `Bridge ${bridge.id}`).then(fetchedHeight => {
              if (fetchedHeight) {
                // Update the POI with the fetched height
                const poiIndex = pois.findIndex(p => p.id === `bridge_${bridge.id}`)
                if (poiIndex !== -1) {
                  pois[poiIndex].height = fetchedHeight
                }
              }
            })
          }
          
          pois.push({
            id: `bridge_${bridge.id}`,
            type: 'bridge',
            name: cleanPOIName(bridge.tags?.name || '', 'bridge', bridge.id),
            description: `Bridge${bridge.tags?.bridge_type ? ` (${bridge.tags.bridge_type})` : ''}`,
            coordinates: bridgeCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: 'bridge.png',
            tags: bridge.tags,
            waterway: bridge.tags?.waterway || 'Unknown',
            height: height,
            status: getBridgeStatus(bridge.tags)
          })
        }
      }
    })
  }
  
  // Check harbors and marinas
  if (docksData?.elements) {
    docksData.elements.forEach((dock: any) => {
      if (isPOINearSegment(dock, startCoord, endCoord, 100)) { // 100m tolerance for docks
        const dockCoord = getPOICoordinates(dock)
        if (dockCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, dockCoord)
          const dockType = dock.tags?.harbour ? 'harbor' : 'marina'
          pois.push({
            id: `${dockType}_${dock.id}`,
            type: dockType as 'harbor' | 'marina',
            name: cleanPOIName(dock.tags?.name || '', dockType, dock.id),
            description: `${dockType === 'harbor' ? 'Harbor' : 'Marina'}${dock.tags?.seamark_type ? ` (${dock.tags.seamark_type})` : ''}`,
            coordinates: dockCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: '⚓',
            tags: dock.tags,
            waterway: dock.tags?.waterway || 'Unknown',
            depth: dock.tags?.depth ? parseFloat(dock.tags.depth) : undefined
          })
        }
      }
    })
  }

  // Check for buoys, beacons, and lights (marine navigation aids)
  if (docksData?.elements) {
    docksData.elements.forEach((navAid: any) => {
      if (isPOINearSegment(navAid, startCoord, endCoord, 50)) { // 50m tolerance for navigation aids
        const navCoord = getPOICoordinates(navAid)
        if (navCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, navCoord)
          let navType: 'buoy' | 'beacon' | 'light' = 'buoy'
          let icon = '🔴'
          let description = 'Navigation aid'
          
          if (navAid.tags?.seamark_type === 'beacon') {
            navType = 'beacon'
            icon = '🏮'
            description = 'Navigation beacon'
          } else if (navAid.tags?.seamark_type === 'light') {
            navType = 'light'
            icon = '💡'
            description = 'Navigation light'
          } else if (navAid.tags?.buoy) {
            navType = 'buoy'
            icon = '🔴'
            description = 'Navigation buoy'
          }
          
          pois.push({
            id: `${navType}_${navAid.id}`,
            type: navType,
            name: navAid.tags?.name || `${navType} ${navAid.id}`,
            description: description,
            coordinates: navCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: icon,
            tags: navAid.tags,
            waterway: navAid.tags?.waterway || 'Unknown'
          })
        }
      }
    })
  }

  // Check gas stations
  if (gasStationsData?.elements) {
    gasStationsData.elements.forEach((gasStation: any) => {
      if (isPOINearSegment(gasStation, startCoord, endCoord, 200)) { // 200m tolerance for gas stations
        const gasCoord = getPOICoordinates(gasStation)
        if (gasCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, gasCoord)
          pois.push({
            id: `gas_station_${gasStation.id}`,
            type: 'gas_station',
            name: cleanPOIName(gasStation.tags?.name || '', 'gas_station', gasStation.id),
            description: `Fuel station${gasStation.tags?.fuel ? ` (${gasStation.tags.fuel})` : ''}`,
            coordinates: gasCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: '⛽',
            tags: gasStation.tags,
            waterway: gasStation.tags?.waterway || 'Unknown'
          })
        }
      }
    })
  }

  // Check buoys
  if (buoysData?.elements) {
    buoysData.elements.forEach((buoy: any) => {
      if (isPOINearSegment(buoy, startCoord, endCoord, 100)) { // 100m tolerance for buoys
        const buoyCoord = getPOICoordinates(buoy)
        if (buoyCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, buoyCoord)
          const seamarkType = buoy.tags?.['seamark:type'] || 'buoy'
          const buoyName = cleanPOIName(buoy.tags?.name || buoy.tags?.['seamark:name'] || '', 'buoy', buoy.id)
          
          pois.push({
            id: `buoy_${buoy.id}`,
            type: 'buoy',
            name: buoyName,
            description: `Navigation aid: ${seamarkType.replace(/_/g, ' ')}`,
            coordinates: buoyCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: '🟡',
            tags: buoy.tags,
            waterway: buoy.tags?.waterway || 'Unknown'
          })
        }
      }
    })
  }

  // Check for reports (user-submitted alerts and warnings)
  if (reportsData?.elements) {
    reportsData.elements.forEach((report: any) => {
      if (isPOINearSegment(report, startCoord, endCoord, 200)) { // 200m tolerance for reports
        const reportCoord = getPOICoordinates(report)
        if (reportCoord) {
          const distanceFromStart = accumulatedDistance + haversine(startCoord, reportCoord)
          const reportType = report.tags?.alert_type || report.tags?.type || 'unknown'
          const severity = getReportSeverity(report.tags)
          const icon = getReportIcon(reportType)
          const description = getReportDescription(reportType, report.tags)
          
          pois.push({
            id: `report_${report.id}`,
            type: 'report',
            name: `${reportType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Alert`,
            description: description,
            coordinates: reportCoord,
            distance: distanceFromStart,
            estimatedTime: 0, // Will be calculated later
            icon: icon,
            tags: report.tags,
            waterway: report.tags?.waterway || 'Unknown',
            severity: severity,
            reportType: reportType
          })
        }
      }
    })
  }
  
  return pois
}

// Check if a POI is near a route segment
const isPOINearSegment = (
  poi: any,
  startCoord: [number, number],
  endCoord: [number, number],
  tolerance: number
): boolean => {
  const poiCoord = getPOICoordinates(poi)
  if (!poiCoord) return false
  
  // Calculate distance from POI to line segment
  const distance = pointToLineDistance(poiCoord, startCoord, endCoord)
  return distance <= tolerance
}

// Get coordinates from a POI element
const getPOICoordinates = (poi: any): [number, number] | null => {
  if (poi.type === 'node') {
    return [poi.lat, poi.lon]
  } else if (poi.type === 'way' && poi.center) {
    return [poi.center.lat, poi.center.lon]
  }
  return null
}

// Calculate distance from point to line segment
const pointToLineDistance = (
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number => {
  const [px, py] = point
  const [x1, y1] = lineStart
  const [x2, y2] = lineEnd
  
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1
  
  const dot = A * C + B * D
  const lenSq = C * C + D * D
  
  let param = -1
  if (lenSq !== 0) param = dot / lenSq
  
  let xx, yy
  
  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }
  
  const dx = px - xx
  const dy = py - yy
  
  return Math.sqrt(dx * dx + dy * dy) * 111000 // Convert to meters (approximate)
}

// Get lock status from tags
const getLockStatus = (tags: Record<string, string>): 'open' | 'closed' | 'unknown' => {
  if (tags.lock_status === 'open' || tags.status === 'open') return 'open'
  if (tags.lock_status === 'closed' || tags.status === 'closed') return 'closed'
  return 'unknown'
}

// Get bridge status from tags
const getBridgeStatus = (tags: Record<string, string>): 'open' | 'closed' | 'unknown' => {
  if (tags.bridge_status === 'open' || tags.status === 'open') return 'open'
  if (tags.bridge_status === 'closed' || tags.status === 'closed') return 'closed'
  return 'unknown'
}

// Get report severity from tags
const getReportSeverity = (tags: Record<string, string>): 'low' | 'medium' | 'high' | 'critical' => {
  if (tags.severity === 'critical') return 'critical'
  if (tags.severity === 'high') return 'high'
  if (tags.severity === 'medium') return 'medium'
  return 'low'
}

// Get report icon based on type
const getReportIcon = (reportType: string): string => {
  switch (reportType) {
    case 'shallow_water': return '💧'
    case 'bridge_closed': return '🌉'
    case 'lock_closed': return '🚦'
    case 'obstruction': return '🚧'
    case 'hazardous_navigation': return '⚠️'
    case 'speed_limit': return '🚫'
    case 'port_full': return '⚓'
    case 'accident': return '🚨'
    case 'police_checkpoint': return '👮'
    default: return '🚨'
  }
}

// Get report description based on type and tags
const getReportDescription = (reportType: string, tags: Record<string, string>): string => {
  const baseDescription = tags.description || tags.note || ''
  switch (reportType) {
    case 'shallow_water': return `Shallow water warning${baseDescription ? `: ${baseDescription}` : ''}`
    case 'bridge_closed': return `Bridge closed${baseDescription ? `: ${baseDescription}` : ''}`
    case 'lock_closed': return `Lock closed${baseDescription ? `: ${baseDescription}` : ''}`
    case 'obstruction': return `Navigation obstruction${baseDescription ? `: ${baseDescription}` : ''}`
    case 'hazardous_navigation': return `Hazardous navigation conditions${baseDescription ? `: ${baseDescription}` : ''}`
    case 'speed_limit': return `Speed limit / No-wake zone${baseDescription ? `: ${baseDescription}` : ''}`
    case 'port_full': return `Port/berth full${baseDescription ? `: ${baseDescription}` : ''}`
    case 'accident': return `Accident/vessel in distress${baseDescription ? `: ${baseDescription}` : ''}`
    case 'police_checkpoint': return `Police/inspection checkpoint${baseDescription ? `: ${baseDescription}` : ''}`
    default: return `Navigation alert${baseDescription ? `: ${baseDescription}` : ''}`
  }
}

// Haversine distance calculation (copied from routing.ts)
const haversine = (a: [number, number], b: [number, number]): number => {
  const R = 6371000 // Earth's radius in meters
  const toRad = (d: number) => d * Math.PI / 180
  
  const [lat1, lon1] = a, [lat2, lon2] = b
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// Format distance for display
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

// Format time for display
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  } else {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }
}

// Get POI icon based on type and status
export const getPOIIcon = (poi: POI): string => {
  if (poi.type === 'lock') {
    return poi.status === 'closed' ? '🚦' : '🚦'
  } else if (poi.type === 'bridge') {
    return 'bridge.png' // Use bridge.png file
  } else if (poi.type === 'harbor') {
    return '⚓'
  } else if (poi.type === 'marina') {
    return '⚓' // Same as harbor - anchor emoji
  } else if (poi.type === 'waypoint') {
    return poi.id === 'start' ? '📍' : '🎯'
  } else if (poi.type === 'buoy') {
    return '🔴'
  } else if (poi.type === 'beacon') {
    return '🏮'
  } else if (poi.type === 'light') {
    return '💡'
  } else if (poi.type === 'anchorage') {
    return '⚓'
  } else if (poi.type === 'report') {
    return poi.icon || '🚨'
  }
  return '📍'
}

// Get POI color based on type and status
export const getPOIColor = (poi: POI): string => {
  if (poi.type === 'lock') {
    return poi.status === 'closed' ? 'text-red-600' : 'text-blue-600'
  } else if (poi.type === 'bridge') {
    return poi.status === 'closed' ? 'text-red-600' : 'text-green-600'
  } else if (poi.type === 'harbor' || poi.type === 'marina') {
    return 'text-purple-600'
  } else if (poi.type === 'waypoint') {
    return poi.id === 'start' ? 'text-green-600' : 'text-red-600'
  } else if (poi.type === 'buoy' || poi.type === 'beacon' || poi.type === 'light') {
    return 'text-orange-600'
  } else if (poi.type === 'anchorage') {
    return 'text-indigo-600'
  } else if (poi.type === 'report') {
    if (poi.severity === 'critical') return 'text-red-600'
    if (poi.severity === 'high') return 'text-orange-600'
    if (poi.severity === 'medium') return 'text-yellow-600'
    return 'text-blue-600'
  }
  return 'text-gray-600'
}
