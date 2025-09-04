import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation, AlertTriangle, Settings, X } from 'lucide-react'
import L from 'leaflet'
import { findWaterwayRoute } from '../utils/routing'
import EnhancedPOILayer from '../components/EnhancedPOILayer'
import { useSettings } from '../contexts/SettingsContext'
import { extractRoutePOIs } from '../utils/poiUtils'

// Enhanced POI Popup Styles
const enhancedPopupStyles = `
  .enhanced-poi-popup .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #E5E7EB;
  }
  
  .enhanced-poi-popup .leaflet-popup-content {
    margin: 0;
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
  }
  
  .enhanced-poi-popup .leaflet-popup-tip {
    background: white;
    border: 1px solid #E5E7EB;
    border-top: none;
    border-left: none;
  }
  
  .custom-poi-marker {
    background: transparent !important;
    border: none !important;
  }
`



// Waterways Layer Component
const WaterwaysLayer: React.FC<{ data: any }> = ({ data }) => {
  const map = useMap()
  
  useEffect(() => {
    if (data && data.elements) {
      console.log('WaterwaysLayer: Rendering', data.elements.length, 'waterways')
      console.log('WaterwaysLayer: Sample element:', data.elements[0])
      const waterwaysLayer = L.layerGroup()
      
      let waterwaysAdded = 0
      for (const el of data.elements) {
        if (el.type === 'way' && el.geometry) {
          // Filter out non-navigable waterways (ditches, drains, streams)
          const waterwayType = el.tags?.waterway
          const navigableTypes = ['canal', 'river', 'fairway', 'shipyard', 'navigation']
          
          if (!waterwayType || !navigableTypes.includes(waterwayType)) {
            console.log('WaterwaysLayer: Skipping non-navigable waterway:', waterwayType, el.id)
            continue
          }
          
          // Additional filtering for rivers - only include major/navigable ones
          if (waterwayType === 'river') {
            const width = el.tags?.width ? parseFloat(el.tags.width) : null
            const boat = el.tags?.boat
            const motorboat = el.tags?.motorboat
            const ship = el.tags?.ship
            
            // Skip small rivers unless explicitly marked as boat-accessible
            if (width && width < 10 && !boat && !motorboat && !ship) {
              console.log('WaterwaysLayer: Skipping small river:', el.tags?.name || el.id, 'width:', width)
              continue
            }
            
            // Skip rivers explicitly marked as not accessible to boats
            if (boat === 'no' || motorboat === 'no' || ship === 'no') {
              console.log('WaterwaysLayer: Skipping non-boat river:', el.tags?.name || el.id)
              continue
            }
          }
          
          // Convert geometry to latlng array for Leaflet polyline
          // Overpass API returns {lon: X, lat: Y} format, convert to [lat, lon] for Leaflet
          const latlngs = el.geometry.map((g: any) => [g.lat, g.lon])
          console.log('WaterwaysLayer: Converting coordinates for way', el.id, 'from', el.geometry[0], 'to', latlngs[0])
          
          // Create blue waterway line with white border
          const waterwayLine = L.polyline(latlngs, {
            color: '#3B82F6', // Blue matching app theme
            weight: 6, // Thick line for navigation
            opacity: 0.9,
            lineCap: 'butt', // No rounded caps to avoid breaks
            lineJoin: 'round'
          })
          
          // Create white border line underneath
          const waterwayBorder = L.polyline(latlngs, {
            color: '#FFFFFF', // White border
            weight: 8, // Slightly thicker for border effect
            opacity: 0.8,
            lineCap: 'butt', // No rounded caps to avoid breaks
            lineJoin: 'round'
          })
          
          // Add popup with waterway information
          const waterwayName = el.tags?.name || 'Unnamed waterway'
          waterwayLine.bindPopup(`
            <div style="min-width: 200px;">
              <strong>${waterwayType.toUpperCase()}</strong><br/>
              <strong>Name:</strong> ${waterwayName}<br/>
              <strong>ID:</strong> ${el.id}<br/>
              <strong>Type:</strong> ${waterwayType}
            </div>
          `)
          
          // Add border first (underneath), then main line (on top)
          waterwaysLayer.addLayer(waterwayBorder)
          waterwaysLayer.addLayer(waterwayLine)
          waterwaysAdded++
        }
      }
      
      console.log('WaterwaysLayer: Added', waterwaysAdded, 'waterway lines to map')
      waterwaysLayer.addTo(map)
      
      return () => {
        map.removeLayer(waterwaysLayer)
      }
    }
  }, [data, map])
  
  return null
}




// Custom hook for map clicks
const useMapClick = (mapRef: React.RefObject<L.Map>, mapClickMode: string | null, onMapClick: (lat: number, lng: number) => void) => {
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      console.log('Map clicked at', e.latlng.lat, e.latlng.lng, 'mode:', mapClickMode)
      if (mapClickMode) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    }

    map.on('click', handleClick)
    
    return () => {
      map.off('click', handleClick)
    }
  }, [mapRef, mapClickMode, onMapClick])
}

// Route Layer Component
const RouteLayer: React.FC<{ coordinates: [number, number][], isVisible: boolean }> = ({ coordinates, isVisible }) => {
  const map = useMap()
  
  useEffect(() => {
    if (!isVisible || coordinates.length < 2) return
    
    const routeLayer = L.layerGroup()
    
    // Create main route line
    const routeLine = L.polyline(coordinates, {
      color: '#111827', // Dark color
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    })
    
    // Create dashed overlay for better visibility
    const dashedLine = L.polyline(coordinates, {
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      dashArray: '8 8'
    })
    
    routeLayer.addLayer(routeLine)
    routeLayer.addLayer(dashedLine)
    
    // Add start and end markers
    if (coordinates.length > 0) {
      const startMarker = L.marker(coordinates[0], {
        icon: L.divIcon({
          className: '',
          html: '<div style="padding:6px 12px;background:#10b981;color:#fff;border-radius:6px;font-weight:700;font-size:12px;">START</div>',
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        })
      })
      
      const endMarker = L.marker(coordinates[coordinates.length - 1], {
        icon: L.divIcon({
          className: '',
          html: '<div style="padding:6px 12px;background:#ef4444;color:#fff;border-radius:6px;font-weight:700;font-size:12px;">END</div>',
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        })
      })
      
      routeLayer.addLayer(startMarker)
      routeLayer.addLayer(endMarker)
    }
    
    routeLayer.addTo(map)
    
    // Fit map to route bounds
    if (coordinates.length > 1) {
      const bounds = L.latLngBounds(coordinates)
      map.fitBounds(bounds, { padding: [40, 40] })
    }
    
    return () => {
      map.removeLayer(routeLayer)
    }
  }, [coordinates, isVisible, map])
  
  return null
}

// Calculate geographic distance between two points in meters
const calculateGeographicDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}















const NavigationPage: React.FC = () => {
  const { settings, updateSetting } = useSettings()
  
  // Inject enhanced popup styles
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = enhancedPopupStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentRoute, setCurrentRoute] = useState<any>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [showBottomNavigationPanel, setShowBottomNavigationPanel] = useState(false)
  const [routePOIs, setRoutePOIs] = useState<any[]>([])
  
  // Map data state
  const [waterwaysData, setWaterwaysData] = useState<any>(null)
  const [locksData, setLocksData] = useState<any>(null)
  const [bridgesData, setBridgesData] = useState<any>(null)
  const [docksData, setDocksData] = useState<any>(null)
  const [gasStationsData, setGasStationsData] = useState<any>(null)
  
  // Viewport-based caching
  const [loadedViewports, setLoadedViewports] = useState<Set<string>>(new Set())
  
  // UI state
  const [showWaterways, setShowWaterways] = useState(false)
  const [showLocks, setShowLocks] = useState(false)
  const [showBridges, setShowBridges] = useState(false)
  const [showDocks, setShowDocks] = useState(false)
  const [showGasStations, setShowGasStations] = useState(false)
  const [showMapPanel, setShowMapPanel] = useState(false)
  const [showNavigationModal, setShowNavigationModal] = useState(false)
  const [showAlertPanel, setShowAlertPanel] = useState(false)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  
  // Alert state
  const [alertSelection, setAlertSelection] = useState<'shallow_water' | 'bridge_closed' | 'lock_closed' | 'obstruction' | 'hazardous_navigation' | 'speed_limit' | 'port_full' | 'accident' | 'police_checkpoint' | null>(null)
  const [alertLocation, setAlertLocation] = useState<[number, number] | null>(null)
  
  // Navigation points
  const [mapClickMode, setMapClickMode] = useState<'start' | 'end' | 'alert' | null>(null)
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)
  
  // Map zoom level
  
  const mapRef = useRef<L.Map | null>(null)

  // Helper function to get tile URL and attribution based on map style
  const getMapTileConfig = (mapStyle: string) => {
    switch (mapStyle) {
      case 'standard':
        return {
          url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.pdok.nl/">PDOK</a> | <a href="https://www.kadaster.nl/">Kadaster</a>'
        }
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
        }
      case 'terrain':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
        }
      default:
        return {
          url: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/standaard/EPSG:3857/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.pdok.nl/">PDOK</a> | <a href="https://www.kadaster.nl/">Kadaster</a>'
        }
    }
  }

  // Helper function to create bbox string for Overpass API
  const bboxString = (bounds: L.LatLngBounds) => {
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const bbox = `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`
    console.log('📍 Bbox created:', bbox, 'from bounds:', bounds)
    return bbox
  }

  // Helper function to create viewport key for caching
  const createViewportKey = (bounds: L.LatLngBounds, zoom: number) => {
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    // Round to ~1km grid for caching
    const gridSize = 0.01
    const key = `${Math.floor(sw.lat / gridSize) * gridSize},${Math.floor(sw.lng / gridSize) * gridSize},${Math.floor(ne.lat / gridSize) * gridSize},${Math.floor(ne.lng / gridSize) * gridSize},${zoom}`
    return key
  }

  // Overpass API queries - Focus on navigable waterways only
  const qWaterways = (bounds: L.LatLngBounds) => {
    const bbox = bboxString(bounds)
    return `[out:json][timeout:60];
      way["waterway"~"^(canal|river|fairway|shipyard|navigation)$"](${bbox});
      out tags geom qt;`
  }

  const qPOIs = (bounds: L.LatLngBounds) => {
    const bbox = bboxString(bounds)
    return `[out:json][timeout:60];(
        node["waterway"="lock_gate"](${bbox});
        way["waterway"="lock_gate"](${bbox});
        node["lock"="yes"](${bbox});
        way["lock"="yes"](${bbox});
        node["waterway"="lock"](${bbox});
        way["waterway"="lock"](${bbox});
        way["bridge"]["waterway"](${bbox});
        way["bridge"]["seamark:type"](${bbox});
        way["bridge"]["seamark:bridge:category"](${bbox});
        way["bridge"]["seamark:bridge:movable"](${bbox});
        way["bridge"]["seamark:bridge:fixed"](${bbox});
        way["bridge"]["seamark:bridge:opening"](${bbox});
      ); out tags center qt;`
  }

  // Separate query for harbors and marinas (inspired by kanaalkaart.html)
  const qHarborsMarinas = (bounds: L.LatLngBounds) => {
    const bbox = bboxString(bounds)
    return `[out:json][timeout:60];(
        node["leisure"="marina"](${bbox});
        way["leisure"="marina"](${bbox});
        node["seamark:type"="harbour"]["seamark:harbour:category"~"marina|yacht_harbour"](${bbox});
        node["tourism"="hotel"]["mooring"="yes"](${bbox});
        node["mooring"="yes"](${bbox});
        way["mooring"="yes"](${bbox});
        node["seamark:type"="pontoon"](${bbox});
        node["harbour"](${bbox});
        way["harbour"](${bbox});
        node["seamark_type"="harbour"](${bbox});
      ); out tags center qt;`
  }

  // Query for gas stations and fuel points
  const qGasStations = (bounds: L.LatLngBounds) => {
    const bbox = bboxString(bounds)
    return `[out:json][timeout:60];(
        node["amenity"="fuel"](${bbox});
        way["amenity"="fuel"](${bbox});
        node["seamark:type"="fuel"](${bbox});
        node["fuel"](${bbox});
        way["fuel"](${bbox});
        node["seamark:fuel:type"](${bbox});
      ); out tags center qt;`
  }

  // Combined query for multiple POI types (more efficient)
  const qCombinedPOIs = (bounds: L.LatLngBounds, types: string[]) => {
    const bbox = bboxString(bounds)
    let query = `[out:json][timeout:60];(`
    
    if (types.includes('locks')) {
      query += `
        node["waterway"="lock_gate"](${bbox});
        way["waterway"="lock_gate"](${bbox});
        node["lock"="yes"](${bbox});
        way["lock"="yes"](${bbox});
        node["waterway"="lock"](${bbox});
        way["waterway"="lock"](${bbox});`
    }
    
    if (types.includes('bridges')) {
      query += `
        way["bridge"]["waterway"](${bbox});
        way["bridge"]["seamark:type"](${bbox});
        way["bridge"]["seamark:bridge:category"](${bbox});
        way["bridge"]["seamark:bridge:movable"](${bbox});
        way["bridge"]["seamark:bridge:fixed"](${bbox});
        way["bridge"]["seamark:bridge:opening"](${bbox});`
    }
    
    if (types.includes('harbors')) {
      query += `
        node["leisure"="marina"](${bbox});
        way["leisure"="marina"](${bbox});
        node["seamark:type"="harbour"]["seamark:harbour:category"~"marina|yacht_harbour"](${bbox});
        node["tourism"="hotel"]["mooring"="yes"](${bbox});
        node["mooring"="yes"](${bbox});
        way["mooring"="yes"](${bbox});
        node["seamark:type"="pontoon"](${bbox});
        node["harbour"](${bbox});
        way["harbour"](${bbox});
        node["seamark_type"="harbour"](${bbox});`
    }
    
    if (types.includes('gas_stations')) {
      query += `
        node["amenity"="fuel"](${bbox});
        way["amenity"="fuel"](${bbox});
        node["seamark:type"="fuel"](${bbox});
        node["fuel"](${bbox});
        way["fuel"](${bbox});
        node["seamark:fuel:type"](${bbox});`
    }
    
    query += `); out tags center qt;`
    return query
  }

  // Fetch data from Overpass API
  const fetchOverpass = async (query: string, type: string) => {
    try {
      console.log(`🌐 Fetching ${type} data...`)
      console.log(`📝 Query:`, query)
      
      // Try main Overpass API first
      let response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
      })
      
      console.log(`📡 Response status:`, response.status, response.statusText)
      
      // If main API fails, try alternative endpoint
      if (!response.ok) {
        console.log(`⚠️ Main API failed, trying alternative endpoint...`)
        response = await fetch('https://overpass.kumi.systems/api/interpreter', {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
        })
        console.log(`📡 Alternative API response status:`, response.status, response.statusText)
      }
      
      if (!response.ok) {
        console.log(`❌ ${type} fetch failed with status: ${response.status}`)
        const errorText = await response.text()
        console.log(`❌ Error response:`, errorText)
        return null
      }
      
      const data = await response.json()
      console.log(`✅ ${type} data received:`, data.elements?.length || 0, 'elements')
      
      if (data.elements && data.elements.length > 0) {
        console.log(`🔍 First element:`, data.elements[0])
        
        // Log bridge-specific information for debugging
        if (type === 'POIs') {
          const bridges = data.elements.filter((el: any) => el.tags?.bridge)
          console.log(`🌉 Found ${bridges.length} bridges in POI data`)
          if (bridges.length > 0) {
            console.log(`🌉 Sample bridge:`, bridges[0])
          }
        }
      }
      
      return data
    } catch (error) {
      console.error(`❌ Error fetching ${type} data:`, error)
      return null
    }
  }

  // Load waterways data
  const loadWaterwaysData = async (bounds: L.LatLngBounds) => {
    console.log('🌊 Loading waterways data for bounds:', bounds)
    try {
      // Try the main query first
      let data = await fetchOverpass(qWaterways(bounds), 'waterways')
      
      // If no data, try a focused fallback query (canals and rivers only)
      if (!data || !data.elements || data.elements.length === 0) {
        console.log('⚠️ Main query failed, trying focused fallback query...')
        const fallbackQuery = `[out:json][timeout:60];
          way["waterway"~"^(canal|river)$"](${bboxString(bounds)});
          out tags geom qt;`
        data = await fetchOverpass(fallbackQuery, 'waterways (focused fallback)')
      }
      
      if (data && data.elements && data.elements.length > 0) {
        console.log('✅ Waterways data loaded successfully:', data.elements.length, 'elements')
        console.log('🔍 Sample waterway:', data.elements[0])
        setWaterwaysData(data)
        return data
      } else {
        console.log('⚠️ Waterways data empty or invalid:', data)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading waterways data:', error)
      return null
    }
  }

  // Load POIs data (locks, bridges) - separate from harbors/marinas
  const loadPOIsData = async (bounds: L.LatLngBounds) => {
    console.log('🏗️ Loading POIs data for bounds:', bounds)
    try {
      const data = await fetchOverpass(qPOIs(bounds), 'POIs')
      if (data && data.elements && data.elements.length > 0) {
        console.log('✅ POIs data loaded successfully:', data.elements.length, 'elements')
        console.log('🔍 Sample POI:', data.elements[0])
        
        // Filter data by type
        const locks = data.elements.filter((el: any) => 
          (el.type === 'node' && el.tags?.waterway === 'lock_gate') ||
          (el.type === 'way' && el.tags?.waterway === 'lock_gate') ||
          (el.type === 'node' && el.tags?.lock === 'yes') ||
          (el.type === 'way' && el.tags?.lock === 'yes') ||
          (el.type === 'node' && el.tags?.waterway === 'lock') ||
          (el.type === 'way' && el.tags?.waterway === 'lock')
        )
        
        const bridges = data.elements.filter((el: any) => 
          el.type === 'way' && el.tags?.bridge
        )
        
        console.log(`📊 Filtered data - Locks: ${locks.length}, Bridges: ${bridges.length}`)
        
        setLocksData({ elements: locks })
        
        // Only load bridges at zoom level 16 or higher
        if (mapRef.current && mapRef.current.getZoom() >= 16) {
          setBridgesData({ elements: bridges })
        } else {
          setBridgesData(null)
        }
        
        return data
      } else {
        console.log('⚠️ POIs data empty or invalid:', data)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading POIs data:', error)
      return null
    }
  }

  // Load harbors and marinas data separately
  const loadHarborsMarinasData = async (bounds: L.LatLngBounds) => {
    console.log('⚓ Loading harbors/marinas data for bounds:', bounds)
    try {
      const data = await fetchOverpass(qHarborsMarinas(bounds), 'Harbors/Marinas')
      if (data && data.elements && data.elements.length > 0) {
        console.log('✅ Harbors/Marinas data loaded successfully:', data.elements.length, 'elements')
        console.log('🔍 Sample Harbor/Marina:', data.elements[0])
        
        setDocksData({ elements: data.elements })
        return data
      } else {
        console.log('⚠️ Harbors/Marinas data empty or invalid:', data)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading harbors/marinas data:', error)
      return null
    }
  }

  // Load gas stations data
  const loadGasStationsData = async (bounds: L.LatLngBounds) => {
    console.log('⛽ Loading gas stations data for bounds:', bounds)
    try {
      const data = await fetchOverpass(qGasStations(bounds), 'Gas Stations')
      if (data && data.elements && data.elements.length > 0) {
        console.log('✅ Gas Stations data loaded successfully:', data.elements.length, 'elements')
        console.log('🔍 Sample Gas Station:', data.elements[0])
        
        setGasStationsData({ elements: data.elements })
        return data
      } else {
        console.log('⚠️ Gas Stations data empty or invalid:', data)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading gas stations data:', error)
      return null
    }
  }

  // Load multiple POI types efficiently with combined query
  const loadCombinedPOIsData = async (bounds: L.LatLngBounds, types: string[]) => {
    console.log('🏗️ Loading combined POIs data for types:', types, 'bounds:', bounds)
    try {
      const data = await fetchOverpass(qCombinedPOIs(bounds, types), `Combined POIs (${types.join(', ')})`)
      if (data && data.elements && data.elements.length > 0) {
        console.log('✅ Combined POIs data loaded successfully:', data.elements.length, 'elements')
        
        // Filter and set data for each type
        if (types.includes('locks')) {
          const locks = data.elements.filter((el: any) => 
            (el.type === 'node' && el.tags?.waterway === 'lock_gate') ||
            (el.type === 'way' && el.tags?.waterway === 'lock_gate') ||
            (el.type === 'node' && el.tags?.lock === 'yes') ||
            (el.type === 'way' && el.tags?.lock === 'yes') ||
            (el.type === 'node' && el.tags?.waterway === 'lock') ||
            (el.type === 'way' && el.tags?.waterway === 'lock')
          )
          setLocksData({ elements: locks })
          console.log('🔒 Locks filtered:', locks.length)
        }
        
        if (types.includes('bridges')) {
          const bridges = data.elements.filter((el: any) => 
            el.type === 'way' && el.tags?.bridge
          )
          if (mapRef.current && mapRef.current.getZoom() >= 16) {
            setBridgesData({ elements: bridges })
          } else {
            setBridgesData(null)
          }
          console.log('🌉 Bridges filtered:', bridges.length)
        }
        
        if (types.includes('harbors')) {
          const harbors = data.elements.filter((el: any) => 
            el.tags?.leisure === 'marina' ||
            el.tags?.['seamark:type'] === 'harbour' ||
            el.tags?.mooring === 'yes' ||
            el.tags?.harbour ||
            el.tags?.['seamark:type'] === 'pontoon'
          )
          setDocksData({ elements: harbors })
          console.log('⚓ Harbors filtered:', harbors.length)
        }
        
        if (types.includes('gas_stations')) {
          const gasStations = data.elements.filter((el: any) => 
            el.tags?.amenity === 'fuel' ||
            el.tags?.['seamark:type'] === 'fuel' ||
            el.tags?.fuel ||
            el.tags?.['seamark:fuel:type']
          )
          setGasStationsData({ elements: gasStations })
          console.log('⛽ Gas Stations filtered:', gasStations.length)
        }
        
        return data
      } else {
        console.log('⚠️ Combined POIs data empty or invalid:', data)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading combined POIs data:', error)
      return null
    }
  }

  // Handle map clicks for navigation
  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng, 'mode:', mapClickMode)
    
    if (mapClickMode === 'start') {
      // Try to snap start point to nearest waterway
      const snappedStart = findNearestWaterwayPoint(lat, lng)
      let newStartPoint: [number, number]
      
      if (snappedStart) {
        newStartPoint = snappedStart.point
        console.log('✅ Start point snapped to waterway:', newStartPoint, 'distance:', snappedStart.distance.toFixed(1) + 'm')
      } else {
        newStartPoint = [lat, lng]
        console.log('⚠️ Start point set (no nearby waterway):', newStartPoint)
      }
      
      setStartPoint(newStartPoint)
      
      // Switch to end point mode
      setMapClickMode('end')
      console.log('🎯 Now click to set end point')
      
    } else if (mapClickMode === 'end') {
      // Try to snap end point to nearest waterway
      const snappedEnd = findNearestWaterwayPoint(lat, lng)
      let newEndPoint: [number, number]
      
      if (snappedEnd) {
        newEndPoint = snappedEnd.point
        console.log('✅ End point snapped to waterway:', newEndPoint, 'distance:', snappedEnd.distance.toFixed(1) + 'm')
      } else {
        newEndPoint = [lat, lng]
        console.log('⚠️ End point set (no nearby waterway):', newEndPoint)
      }
      
      setEndPoint(newEndPoint)
      
      // Clear click mode
      setMapClickMode(null)
      console.log('🚀 Both points set, starting navigation...')
      
      // START NAVIGATION IMMEDIATELY with the snapped coordinates
      startNavigationWithCoordinates(newEndPoint)
      
    } else {
      console.log('No click mode set, ignoring click')
    }
  }


  // Find nearest waterway point to given coordinates (simplified - no graph building needed)
  const findNearestWaterwayPoint = (lat: number, lng: number) => {
    if (!waterwaysData || !waterwaysData.elements) {
      console.log('No waterways data available for snapping')
      return null
    }

    // For now, just return the input coordinates
    // The routing system will handle proper snapping
    console.log(`Using input coordinates for waterway point: [${lat}, ${lng}]`)
    return { 
      point: [lat, lng] as [number, number], 
      distance: 0, 
      waterwayId: 'input_coord' 
    }
  }

  // Start navigation with actual coordinates (fixes async state issue)
  const startNavigationWithCoordinates = async (endCoord: [number, number]) => {
    if (!startPoint) {
      console.log('❌ Missing start point')
      return
    }
    
    console.log('🚀 Starting navigation from', startPoint, 'to', endCoord)
    
    // Set routing status
    setIsNavigating(true)
    
    try {
      console.log('🔍 Calling findWaterwayRoute with coordinates:', { startPoint, endCoord, waterwaysData })
      const route = await findWaterwayRoute(startPoint, endCoord, waterwaysData, settings.boatSpeed)
      
      if (!route) {
        console.log('❌ No waterway route found - navigation cannot start')
        alert('❌ No waterway route found! Both start and end points must be on waterways.')
        setIsNavigating(false)
        return
      }
      
      console.log('✅ Waterway route created:', route)
      
      // Set navigation state (route is guaranteed to exist here)
      setCurrentRoute(route)
      setRouteCoordinates(route.coordinates)
      setCurrentStep(0)
      
      // Calculate POIs along the route
      const routePOIsData = extractRoutePOIs(
        route.coordinates,
        locksData,
        bridgesData,
        docksData,
        startPoint,
        endCoord,
        gasStationsData
      )
      setRoutePOIs(routePOIsData.pois)
      
      // Show bottom navigation panel when route is complete
      setShowBottomNavigationPanel(true)
      
      console.log('🎉 Navigation started with waterway route!')
    } catch (error) {
      console.error('❌ Error finding waterway route:', error)
      alert('❌ Error finding waterway route! Please try again.')
      setIsNavigating(false)
    }
  }

  // Stop navigation
  const stopNavigation = () => {
    setIsNavigating(false)
    setCurrentRoute(null)
    setRouteCoordinates([])
    setCurrentStep(0)
    setStartPoint(null)
    setEndPoint(null)
    setMapClickMode(null)
    setShowBottomNavigationPanel(false)
    setRoutePOIs([])
    console.log('🛑 Navigation stopped')
  }

  // Event listeners for buttons
  useEffect(() => {
    const handleToggleShowMapPanel = () => {
      setShowMapPanel(!showMapPanel)
    }
    
    const handleShowNavigationModal = () => {
      setShowNavigationModal(true)
    }
    
    const handleLocateMe = (event: CustomEvent) => {
      const { lat, lng } = event.detail
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 16)
        console.log('Locating user at:', lat, lng)
      }
    }
    
    window.addEventListener('toggleShowMapPanel', handleToggleShowMapPanel)
    window.addEventListener('showNavigationModal', handleShowNavigationModal)
    window.addEventListener('locateMe', handleLocateMe as EventListener)
    
    return () => {
      window.removeEventListener('toggleShowMapPanel', handleToggleShowMapPanel)
      window.removeEventListener('showNavigationModal', handleShowNavigationModal)
      window.removeEventListener('locateMe', handleLocateMe as EventListener)
    }
  }, [showMapPanel])

  // Load POI data on-demand when toggles are enabled
  useEffect(() => {
    const loadPOIDataOnDemand = async () => {
      if (!mapRef.current) return
      
      const bounds = mapRef.current.getBounds()
      const zoom = mapRef.current.getZoom()
      
      if (zoom < 10) return
      
      try {
        // Determine which POI types need to be loaded
        const typesToLoad: string[] = []
        const needsCombinedLoad = []
        
        if ((showLocks || showBridges) && !locksData && !bridgesData) {
          if (showLocks) typesToLoad.push('locks')
          if (showBridges) typesToLoad.push('bridges')
          needsCombinedLoad.push('pois')
        }
        
        if (showDocks && !docksData) {
          typesToLoad.push('harbors')
          needsCombinedLoad.push('harbors')
        }
        
        if (showGasStations && !gasStationsData) {
          typesToLoad.push('gas_stations')
          needsCombinedLoad.push('gas_stations')
        }
        
        // Use combined query if multiple types need loading
        if (typesToLoad.length > 1) {
          console.log('🏗️ Loading combined POIs data on-demand for types:', typesToLoad)
          await loadCombinedPOIsData(bounds, typesToLoad)
        } else if (typesToLoad.length === 1) {
          // Use individual queries for single types
          if (typesToLoad.includes('locks') || typesToLoad.includes('bridges')) {
            console.log('🏗️ Loading POIs data on-demand...')
            await loadPOIsData(bounds)
          }
          if (typesToLoad.includes('harbors')) {
            console.log('⚓ Loading harbors/marinas data on-demand...')
            await loadHarborsMarinasData(bounds)
          }
          if (typesToLoad.includes('gas_stations')) {
            console.log('⛽ Loading gas stations data on-demand...')
            await loadGasStationsData(bounds)
          }
        }
      } catch (error) {
        console.error('❌ Error loading POI data on-demand:', error)
      }
    }
    
    loadPOIDataOnDemand()
  }, [showLocks, showBridges, showDocks, showGasStations, locksData, bridgesData, docksData, gasStationsData])

  // Initial data load when component mounts - only load for current viewport
  useEffect(() => {
    const timer = setTimeout(async () => {
      console.log('🚀 Initial data load triggered for current viewport')
      
      // Set all layers to visible initially
      setShowWaterways(true)
      setShowLocks(true)
      setShowBridges(true)
      setShowDocks(true)
      
      // Only load data if map is ready and we have a reasonable zoom level
      if (mapRef.current) {
        const bounds = mapRef.current.getBounds()
        const zoom = mapRef.current.getZoom()
        const viewportKey = createViewportKey(bounds, zoom)
        
        // Check if we've already loaded this viewport
        if (loadedViewports.has(viewportKey)) {
          console.log('📍 Viewport already loaded, skipping initial load')
          setIsLoadingMap(false)
          return
        }
        
        console.log('📍 Loading initial data for current viewport:', bounds, 'zoom:', zoom)
        
        try {
          // Only load if zoom level is appropriate (not too zoomed out)
          if (zoom >= 10) {
            // Load waterways data first (always needed for navigation)
            console.log('🌊 Loading waterways data...')
            const waterwaysResult = await loadWaterwaysData(bounds)
            console.log('✅ Waterways data loaded:', !!waterwaysResult)
            
            // Load POI data efficiently
            const enabledTypes: string[] = []
            if (showLocks || showBridges) {
              if (showLocks) enabledTypes.push('locks')
              if (showBridges) enabledTypes.push('bridges')
            }
            if (showDocks) enabledTypes.push('harbors')
            if (showGasStations) enabledTypes.push('gas_stations')
            
            if (enabledTypes.length > 0) {
              if (enabledTypes.length > 1) {
                console.log('🏗️ Loading combined POIs data for types:', enabledTypes)
                const combinedResult = await loadCombinedPOIsData(bounds, enabledTypes)
                console.log('✅ Combined POIs data loaded:', !!combinedResult)
              } else {
                // Use individual queries for single types
                if (enabledTypes.includes('locks') || enabledTypes.includes('bridges')) {
                  console.log('🏗️ Loading POIs data...')
                  const poisResult = await loadPOIsData(bounds)
                  console.log('✅ POIs data loaded:', !!poisResult)
                }
                if (enabledTypes.includes('harbors')) {
                  console.log('⚓ Loading harbors/marinas data...')
                  const harborsResult = await loadHarborsMarinasData(bounds)
                  console.log('✅ Harbors/Marinas data loaded:', !!harborsResult)
                }
                if (enabledTypes.includes('gas_stations')) {
                  console.log('⛽ Loading gas stations data...')
                  const gasStationsResult = await loadGasStationsData(bounds)
                  console.log('✅ Gas Stations data loaded:', !!gasStationsResult)
                }
              }
            }
            
            // Mark this viewport as loaded
            setLoadedViewports(prev => new Set(prev).add(viewportKey))
          }
          
          console.log('🎉 All initial data loaded successfully!')
          setIsLoadingMap(false)
        } catch (error) {
          console.error('❌ Error loading initial data:', error)
          setIsLoadingMap(false)
        }
      } else {
        // Map not ready yet, just set loading to false
        setIsLoadingMap(false)
      }
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Use custom map click hook
  useMapClick(mapRef, mapClickMode, handleMapClick)

  // Track zoom level changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

  }, [])

  // Handle map style changes from NavigationLayout
  useEffect(() => {
    const handleMapStyleChange = (event: CustomEvent) => {
      const { style } = event.detail
      updateSetting('mapStyle', style)
      console.log('🗺️ Map style changed to:', style)
    }

    const handleSaveCurrentRoute = () => {
      if (currentRoute && startPoint && endPoint) {
        const routeName = prompt('Enter a name for this route:')
        if (routeName) {
          const newRoute = {
            id: Date.now().toString(),
            name: routeName,
            startPoint,
            endPoint,
            routeData: currentRoute
          }
          // This would need to be handled by the parent component
          window.dispatchEvent(new CustomEvent('routeSaved', { detail: { route: newRoute } }))
        }
      } else {
        alert('No active route to save. Please start navigation first.')
      }
    }

    const handleLoadSavedRoute = (event: CustomEvent) => {
      const { route } = event.detail
      setStartPoint(route.startPoint)
      setEndPoint(route.endPoint)
      if (route.routeData) {
        setCurrentRoute(route.routeData)
        setRouteCoordinates(route.routeData.coordinates)
      }
      console.log('🗺️ Loaded saved route:', route.name)
    }

    window.addEventListener('changeMapStyle', handleMapStyleChange as EventListener)
    window.addEventListener('saveCurrentRoute', handleSaveCurrentRoute)
    window.addEventListener('loadSavedRoute', handleLoadSavedRoute as EventListener)
    
    return () => {
      window.removeEventListener('changeMapStyle', handleMapStyleChange as EventListener)
      window.removeEventListener('saveCurrentRoute', handleSaveCurrentRoute)
      window.removeEventListener('loadSavedRoute', handleLoadSavedRoute as EventListener)
    }
  }, [currentRoute, startPoint, endPoint, updateSetting])

  // Add map movement handler to load data for new areas with viewport caching
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    let moveTimeout: ReturnType<typeof setTimeout>
    const handleMapMove = () => {
      // Clear previous timeout
      clearTimeout(moveTimeout)
      
      // Set new timeout to load data after map stops moving
      moveTimeout = setTimeout(async () => {
        const bounds = map.getBounds()
        const zoom = map.getZoom()
        const viewportKey = createViewportKey(bounds, zoom)
        
        console.log('🗺️ Map moved to new bounds:', bounds, 'zoom:', zoom)
        
        // Check if we've already loaded this viewport
        if (loadedViewports.has(viewportKey)) {
          console.log('📍 Viewport already loaded, skipping')
          return
        }
        
        // Only load data if zoom level is appropriate (not too zoomed out)
        if (zoom >= 10) {
          console.log('🌊 Loading data for new map area...')
          
          try {
            // Load waterways data for new area (always needed)
            await loadWaterwaysData(bounds)
            
            // Load POI data efficiently
            const enabledTypes: string[] = []
            if (showLocks || showBridges) {
              if (showLocks) enabledTypes.push('locks')
              if (showBridges) enabledTypes.push('bridges')
            }
            if (showDocks) enabledTypes.push('harbors')
            if (showGasStations) enabledTypes.push('gas_stations')
            
            if (enabledTypes.length > 0) {
              if (enabledTypes.length > 1) {
                await loadCombinedPOIsData(bounds, enabledTypes)
              } else {
                // Use individual queries for single types
                if (enabledTypes.includes('locks') || enabledTypes.includes('bridges')) {
                  await loadPOIsData(bounds)
                }
                if (enabledTypes.includes('harbors')) {
                  await loadHarborsMarinasData(bounds)
                }
                if (enabledTypes.includes('gas_stations')) {
                  await loadGasStationsData(bounds)
                }
              }
            }
            
            // Mark this viewport as loaded
            setLoadedViewports(prev => new Set(prev).add(viewportKey))
            
            console.log('✅ Data loaded for new map area')
          } catch (error) {
            console.error('❌ Error loading data for new area:', error)
          }
        }
      }, 1000) // Wait 1 second after map stops moving
    }

    map.on('moveend', handleMapMove)
    
    return () => {
      map.off('moveend', handleMapMove)
      clearTimeout(moveTimeout)
    }
  }, [loadedViewports])

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Mobile-specific CSS */}
      <style>{`
        @media (max-width: 640px) {
          .leaflet-container {
            touch-action: manipulation;
          }
          .leaflet-control-zoom {
            transform: scale(0.9);
            transform-origin: bottom right;
          }
        }
      `}</style>

      {/* Show on Map Panel */}
      {showMapPanel && (
        <div className="fixed right-4 top-20 z-[9999] bg-gradient-to-br from-blue-600 to-cyan-600 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl p-4 w-64">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Map Layers</h3>
            <button
              onClick={() => setShowMapPanel(false)}
              className="text-white hover:text-blue-200 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Waterways Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">🌊</span>
                <span className="text-sm font-medium">Waterways</span>
              </div>
              <button
                onClick={() => setShowWaterways(!showWaterways)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  showWaterways ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    showWaterways ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Locks Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">🚦</span>
                <span className="text-sm font-medium">Locks</span>
              </div>
              <button
                onClick={() => setShowLocks(!showLocks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  showLocks ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    showLocks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Bridges Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">🟩</span>
                <span className="text-sm font-medium">Bridges</span>
                <span className="text-xs text-blue-200">(Zoom ≥16)</span>
              </div>
              <button
                onClick={() => setShowBridges(!showBridges)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  showBridges ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    showBridges ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Docks Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">⚓</span>
                <span className="text-sm font-medium">Harbors</span>
              </div>
              <button
                onClick={() => setShowDocks(!showDocks)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  showDocks ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    showDocks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {/* Gas Stations Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="text-2xl">⛽</span>
                <span className="text-sm font-medium">Gas Stations</span>
              </div>
              <button
                onClick={() => setShowGasStations(!showGasStations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${
                  showGasStations ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    showGasStations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Loading Map Status */}
      {isLoadingMap && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-blue-600 text-white px-6 py-3 rounded-lg shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-base font-medium">Loading Map...</span>
          </div>
        </div>
      )}

      {/* Navigation Status */}
      {mapClickMode && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">
              {mapClickMode === 'start' ? 'Click to set START point' : 'Click to set END point'}
            </span>
          </div>
        </div>
      )}


      {/* Waterway Route Status */}
      {startPoint && endPoint && !isNavigating && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-orange-600 text-white px-4 py-2 rounded-lg shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              ⚠️ Both points set - checking for waterway route...
            </span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      {isNavigating && currentRoute && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-black/90 backdrop-blur-sm text-white shadow-2xl border-b border-blue-400/20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex-1">
              <div className="text-sm text-blue-300 mb-1">
                Route Overview
              </div>
              <div className="text-lg font-semibold">
                {currentRoute.steps[currentStep]?.instruction || 'Follow waterways to destination'}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-cyan-300">
                {(currentRoute.totalDistance / 1000).toFixed(1)} km
              </div>
              <div className="text-xl font-bold text-blue-300">
                {Math.round(currentRoute.totalDistance / (settings.boatSpeed * 1000 / 3600) / 60)} min @ {settings.boatSpeed} km/h
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-6">
              {!showBottomNavigationPanel && currentRoute && (
                <button
                  onClick={() => setShowBottomNavigationPanel(true)}
                  className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors duration-200 border border-green-500/30 text-green-300 text-sm font-medium"
                  title="More Route Info"
                >
                  More Route Info
                </button>
              )}
              <button
                onClick={stopNavigation}
                className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors duration-200 border border-red-500/30"
                title="Stop Navigation"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`w-full ${isNavigating ? 'h-full' : 'h-screen'}`} style={{zIndex: 1, position: 'relative'}}>
        <MapContainer
          center={[52.3676, 4.9041]} // Amsterdam center
          zoom={15}
          className="h-full w-full"
          style={{zIndex: 1, position: 'relative'}}
          ref={mapRef}
        >
          {/* Base Map - Dynamic style based on settings */}
          <TileLayer
            url={getMapTileConfig(settings.mapStyle).url}
            attribution={getMapTileConfig(settings.mapStyle).attribution}
            maxZoom={19}
            bounds={settings.mapStyle === 'standard' ? [[50.5, 3.0], [54.0, 7.5]] : undefined}
            key={settings.mapStyle} // Force re-render when map style changes
          />
          
          {/* Route Line */}
          {routeCoordinates && routeCoordinates.length > 0 && (
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: '#22c55e',
                weight: 6,
                opacity: 0.9
              }}
            />
          )}

          {/* Navigation Points */}
          {startPoint && (
            <Marker 
              position={startPoint} 
              icon={L.divIcon({
                className: 'custom-start-marker',
                html: `<div style="
                  width: 24px; 
                  height: 24px; 
                  background: #22c55e; 
                  border-radius: 50%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  color: white; 
                  font-size: 14px; 
                  font-weight: bold;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  border: 3px solid #16a34a;
                ">📍</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            />
          )}
          
          {endPoint && (
            <Marker 
              position={endPoint} 
              icon={L.divIcon({
                className: 'custom-end-marker',
                html: `<div style="
                  width: 24px; 
                  height: 24px; 
                  background: #ef4444; 
                  border-radius: 50%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  color: white; 
                  font-size: 14px; 
                  font-weight: bold;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  border: 3px solid #dc2626;
                ">🎯</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            />
          )}

          {/* Waterways Layer */}
          {showWaterways && waterwaysData && (
            <WaterwaysLayer data={waterwaysData} />
          )}
          
          {/* Enhanced POI Layers */}
          {showLocks && locksData && (
            <EnhancedPOILayer data={locksData} poiType="lock" />
          )}
          
          {showBridges && bridgesData && (
            <EnhancedPOILayer data={bridgesData} poiType="bridge" />
          )}
          
          {showDocks && docksData && (
            <EnhancedPOILayer data={docksData} poiType="harbor" />
          )}
          
          {showGasStations && gasStationsData && (
            <EnhancedPOILayer data={gasStationsData} poiType="gas_station" />
          )}
          
          {/* Route Layer */}
          <RouteLayer coordinates={routeCoordinates} isVisible={currentRoute !== null} />

          {/* Test Marker to verify map is working */}
          <Marker 
            position={[52.3676, 4.9041]} 
            icon={L.divIcon({
              className: 'custom-test-marker',
              html: `<div style="
                width: 20px; 
                height: 20px; 
                background: #f59e0b; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-size: 12px; 
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                border: 2px solid #d97706;
              ">T</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <div>
                <strong>Test Marker</strong><br/>
                Amsterdam Center<br/>
                Map is working correctly!
              </div>
            </Popup>
          </Marker>

        </MapContainer>
      </div>

      {/* Bottom Navigation Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-br from-blue-600 to-cyan-600 backdrop-blur-md border-t border-white/30 shadow-2xl">
        <div className="flex items-center justify-center gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium shadow-lg text-sm"
          >
            <Navigation size={20} />
            <span className="font-medium">Navigation</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/reports'}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-white text-sm"
          >
            <AlertTriangle size={20} />
            <span className="font-medium">Reports</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-white text-sm"
          >
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
        

        {/* Route Planning Info */}
        {mapClickMode && (startPoint || endPoint) && (
          <div className="px-4 pb-3 border-t border-white/20 pt-3">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                {startPoint && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Start: {startPoint[0].toFixed(4)}, {startPoint[1].toFixed(4)}
                  </span>
                )}
                {endPoint && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    End: {endPoint[0].toFixed(4)}, {endPoint[1].toFixed(4)}
                  </span>
                )}
                {startPoint && endPoint && (
                  <span>
                    Distance: {Math.round(calculateGeographicDistance(startPoint[0], startPoint[1], endPoint[0], endPoint[1]))}m
                  </span>
                )}
              </div>
              <div className="text-blue-200">
                {mapClickMode === 'start' ? 'Click to set start point' : 
                 mapClickMode === 'end' ? 'Click to set end point' : 'Route ready'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Modal */}
      {showNavigationModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full mx-2">
            <h3 className="text-lg font-semibold mb-4">Start Navigation</h3>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Click the button below, then click on the map to set start and end points
              </div>
              
              <button
                onClick={() => {
                  setShowNavigationModal(false)
                  setMapClickMode('start')
                  console.log('🎯 Click mode set to START - click on map to set start point')
                }}
                className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                🗺️ Start Navigation (Click Start Point)
              </button>
            </div>

            <button
              onClick={() => {
                setShowNavigationModal(false)
                setStartPoint(null)
                setEndPoint(null)
                setMapClickMode(null)
              }}
              className="mt-4 w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}




      {/* Alert Panel */}
      {showAlertPanel && (
        <div className="fixed bottom-32 right-4 z-[9999] bg-white rounded-xl shadow-2xl p-4 w-80 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Add Alert</h3>
            <button
              onClick={() => setShowAlertPanel(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {/* Alert Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAlertSelection('shallow_water')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'shallow_water' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">💧</div>
                <div className="text-sm font-medium">Shallow Water</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('bridge_closed')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'bridge_closed' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🌉</div>
                <div className="text-sm font-medium">Bridge Closed</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('lock_closed')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'lock_closed' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🚦</div>
                <div className="text-sm font-medium">Lock Closed</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('obstruction')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'obstruction' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🚧</div>
                <div className="text-sm font-medium">Obstruction</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('hazardous_navigation')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'hazardous_navigation' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">⚠️</div>
                <div className="text-sm font-medium">Hazardous Navigation</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('speed_limit')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'speed_limit' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🚫</div>
                <div className="text-sm font-medium">Speed / No-Wake Zone</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('port_full')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'port_full' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">⚓</div>
                <div className="text-sm font-medium">Port / Berth Full</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('accident')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'accident' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🚨</div>
                <div className="text-sm font-medium">Accident / Vessel in Distress</div>
              </button>
              
              <button
                onClick={() => setAlertSelection('police_checkpoint')}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  alertSelection === 'police_checkpoint' 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">👮</div>
                <div className="text-sm font-medium">Police / Inspection Checkpoint</div>
              </button>
            </div>
            
            {/* Location Selection */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Location</div>
              {alertLocation ? (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    {alertLocation[0].toFixed(5)}, {alertLocation[1].toFixed(5)}
                  </span>
                  <button
                    onClick={() => setAlertLocation(null)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMapClickMode('alert')
                    setShowAlertPanel(false)
                  }}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  📍 Click on Map to Select Location
                </button>
              )}
            </div>
            
            {/* Submit Button */}
            {alertSelection && alertLocation && (
              <button
                onClick={() => {
                  console.log('🚨 Alert submitted:', { type: alertSelection, location: alertLocation })
                  setShowAlertPanel(false)
                  setAlertSelection(null)
                  setAlertLocation(null)
                  setMapClickMode(null)
                }}
                className="w-full p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                🚨 Submit Alert
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Panel - Google Maps Style */}
      {showBottomNavigationPanel && currentRoute && (
        <div className="fixed left-0 right-0 md:left-0 md:right-auto md:w-96 z-[9999] bg-white border-t md:border-t-0 md:border-r border-gray-200 overflow-hidden bottom-0 md:top-20 md:bottom-20 max-h-96 md:max-h-full">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Route Complete</h3>
                <p className="text-sm text-green-100">
                  {(currentRoute.totalDistance / 1000).toFixed(1)} km • {Math.round(currentRoute.totalDistance / (settings.boatSpeed * 1000 / 3600) / 60)} min
                </p>
              </div>
              <button
                onClick={() => setShowBottomNavigationPanel(false)}
                className="text-white hover:text-green-200 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* POIs List */}
          <div className="p-4 max-h-64 md:max-h-full overflow-y-auto">
            <h4 className="font-semibold text-gray-800 mb-3">Points of Interest Along Route</h4>
            {routePOIs.length > 0 ? (
              <div className="space-y-2">
                {routePOIs.map((poi, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView(poi.coordinates, 16)
                        // Only close panel on mobile, keep open on desktop
                        if (window.innerWidth < 768) {
                          setShowBottomNavigationPanel(false)
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{poi.icon}</div>
                      <div>
                        <div className="font-medium text-gray-900">{poi.name}</div>
                        <div className="text-sm text-gray-600">{poi.description}</div>
                        {poi.distance && (
                          <div className="text-xs text-blue-600">
                            {poi.distance < 1000 
                              ? `${Math.round(poi.distance)}m from start`
                              : `${(poi.distance / 1000).toFixed(1)}km from start`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <Navigation size={16} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Navigation size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No POIs found along this route</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4 border-t border-gray-200 pt-3">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('saveCurrentRoute'))
                    setShowBottomNavigationPanel(false)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Settings size={20} />
                  Save Route
                </button>
                <button
                  onClick={() => {
                    // Share functionality will be implemented later
                    alert('Share functionality coming soon!')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <Navigation size={20} />
                  Share Route
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  )
}

export default NavigationPage
