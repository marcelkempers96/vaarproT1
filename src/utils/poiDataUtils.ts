// Enhanced POI Data Utilities for VaarPro
// Provides comprehensive data gathering and formatting for POI popups

import { POI } from './poiUtils'

export interface EnhancedPOIData {
  // Basic Information
  id: string
  name: string
  type: 'lock' | 'bridge' | 'harbor' | 'marina' | 'gas_station' | 'report' | 'waypoint' | 'buoy' | 'beacon' | 'light' | 'anchorage'
  coordinates: [number, number]
  
  // Address & Location
  address?: string
  waterway?: string
  region?: string
  country?: string
  
  // Physical Dimensions & Clearance
  boatClearance?: {
    height?: number // meters
    width?: number // meters
    maxLength?: number // meters
    maxWidth?: number // meters
    maxDraft?: number // meters
    maxDisplacement?: number // tons
  }
  
  // Operational Information
  operationalInfo?: {
    motorboatAllowed?: boolean
    sailingBoatAllowed?: boolean
    commercialVessels?: boolean
    openingTimes?: string
    operatingHours?: string
    seasonalOperation?: string
    status?: 'open' | 'closed' | 'maintenance' | 'unknown'
    lastUpdated?: string
  }
  
  // Contact & Services
  contactInfo?: {
    phone?: string
    email?: string
    website?: string
    radioChannel?: string
    emergencyContact?: string
  }
  
  // Services & Amenities
  services?: {
    fuel?: boolean
    water?: boolean
    electricity?: boolean
    pumpOut?: boolean
    repairs?: boolean
    provisions?: boolean
    restaurant?: boolean
    showers?: boolean
    wifi?: boolean
    parking?: boolean
  }
  
  // Navigation Information
  navigationInfo?: {
    depth?: number
    approachDepth?: number
    berthCount?: number
    maxVesselLength?: number
    lockType?: string
    bridgeType?: string
    navigationAids?: string[]
    hazards?: string[]
  }
  
  // Additional Information
  additionalInfo?: {
    description?: string
    history?: string
    restrictions?: string[]
    fees?: string
    bookingRequired?: boolean
    advanceNotice?: string
    weatherDependent?: boolean
  }
  
  // External Links
  externalLinks?: {
    officialWebsite?: string
    bookingSystem?: string
    liveStatus?: string
    weatherInfo?: string
    tideInfo?: string
  }
  
  // Metadata
  dataSource?: string
  lastVerified?: string
  confidence?: 'high' | 'medium' | 'low'
}

// Enhanced data extraction from OSM tags
export const extractEnhancedPOIData = (poi: POI, osmElement?: any): EnhancedPOIData => {
  const tags = osmElement?.tags || poi.tags || {}
  
  const enhancedData: EnhancedPOIData = {
    id: poi.id,
    name: poi.name,
    type: poi.type,
    coordinates: poi.coordinates,
    
    // Address & Location
    address: formatAddress(tags),
    waterway: tags.waterway || poi.waterway,
    region: tags.region || tags.state || tags.province,
    country: tags.country || tags.country_code,
    
    // Physical Dimensions & Clearance
    boatClearance: extractBoatClearance(tags, poi.type),
    
    // Operational Information
    operationalInfo: extractOperationalInfo(tags, poi.type),
    
    // Contact & Services
    contactInfo: extractContactInfo(tags),
    
    // Services & Amenities
    services: extractServices(tags, poi.type),
    
    // Navigation Information
    navigationInfo: extractNavigationInfo(tags, poi.type),
    
    // Additional Information
    additionalInfo: extractAdditionalInfo(tags, poi.type),
    
    // External Links
    externalLinks: extractExternalLinks(tags),
    
    // Metadata
    dataSource: 'OpenStreetMap',
    lastVerified: new Date().toISOString(),
    confidence: calculateDataConfidence(tags)
  }
  
  return enhancedData
}

// Format address from OSM tags
const formatAddress = (tags: Record<string, string>): string => {
  const addressParts = []
  
  if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber'])
  if (tags['addr:street']) addressParts.push(tags['addr:street'])
  if (tags['addr:city']) addressParts.push(tags['addr:city'])
  if (tags['addr:postcode']) addressParts.push(tags['addr:postcode'])
  if (tags['addr:country']) addressParts.push(tags['addr:country'])
  
  return addressParts.join(', ') || tags.address || ''
}

// Extract boat clearance information - comprehensive for all dimensions
const extractBoatClearance = (tags: Record<string, string>, _type: string) => {
  const clearance: EnhancedPOIData['boatClearance'] = {}
  
  // Height clearance (bridges) - ALL variations
  const heightTags = ['maxheight', 'height', 'max_height', 'bridge_height', 'clearance_height', 'air_draft', 'max_air_draft', 'vertical_clearance']
  for (const tag of heightTags) {
    if (tags[tag] && !clearance.height) {
      clearance.height = parseFloat(tags[tag])
    }
  }
  
  // Width clearance (locks, bridges) - ALL variations
  const widthTags = ['maxwidth', 'width', 'max_width', 'bridge_width', 'clearance_width', 'beam', 'max_beam', 'boat_width', 'vessel_width', 'lock_width', 'chamber_width']
  for (const tag of widthTags) {
    if (tags[tag] && !clearance.width) {
      clearance.width = parseFloat(tags[tag])
    }
  }
  
  // Length restrictions - ALL variations
  const lengthTags = ['maxlength', 'max_length', 'length', 'max_vessel_length', 'boat_length', 'vessel_length', 'lock_length', 'chamber_length', 'max_boat_length', 'max_ship_length']
  for (const tag of lengthTags) {
    if (tags[tag] && !clearance.maxLength) {
      clearance.maxLength = parseFloat(tags[tag])
    }
  }
  
  // Draft restrictions - ALL variations for locks and bridges
  const draftTags = [
    'maxdraft', 'max_draft', 'draft', 'draught', 'max_draught', 'lock_draft', 'lock_draught', 
    'max_draft_m', 'draft_m', 'draught_m', 'boat_draft', 'boat_draught', 'vessel_draft', 
    'vessel_draught', 'max_boat_draft', 'max_vessel_draft', 'ship_draft', 'ship_draught',
    'max_ship_draft', 'water_draft', 'max_water_draft', 'clearance_draft', 'clearance_draught'
  ]
  for (const tag of draftTags) {
    if (tags[tag] && !clearance.maxDraft) {
      clearance.maxDraft = parseFloat(tags[tag])
    }
  }
  
  // Displacement restrictions - ALL variations
  const displacementTags = ['maxdisplacement', 'max_displacement', 'displacement', 'max_tonnage', 'tonnage', 'max_weight', 'weight', 'max_deadweight', 'deadweight']
  for (const tag of displacementTags) {
    if (tags[tag] && !clearance.maxDisplacement) {
      clearance.maxDisplacement = parseFloat(tags[tag])
    }
  }
  
  return Object.keys(clearance).length > 0 ? clearance : undefined
}

// Extract operational information
const extractOperationalInfo = (tags: Record<string, string>, _type: string) => {
  const operational: EnhancedPOIData['operationalInfo'] = {}
  
  // Vessel type permissions
  if (tags.motorboat !== undefined) {
    operational.motorboatAllowed = tags.motorboat === 'yes'
  }
  if (tags.sailing_boat !== undefined) {
    operational.sailingBoatAllowed = tags.sailing_boat === 'yes'
  }
  if (tags.ship !== undefined) {
    operational.commercialVessels = tags.ship === 'yes'
  }
  if (tags.boat !== undefined) {
    operational.motorboatAllowed = tags.boat === 'yes'
  }
  
  // Operating hours - enhanced for locks
  if (tags.opening_hours) {
    operational.openingTimes = tags.opening_hours
  } else if (tags.operating_hours) {
    operational.openingTimes = tags.operating_hours
  } else if (tags.hours) {
    operational.openingTimes = tags.hours
  } else if (tags.lock_hours) {
    operational.openingTimes = tags.lock_hours
  }
  
  // Additional operating hours
  if (tags.operating_hours) {
    operational.operatingHours = tags.operating_hours
  }
  
  // Seasonal operation
  if (tags.seasonal) {
    operational.seasonalOperation = tags.seasonal
  } else if (tags.season) {
    operational.seasonalOperation = tags.season
  }
  
  // Status - enhanced for locks
  if (tags.status) {
    operational.status = tags.status as any
  } else if (tags.lock_status) {
    operational.status = tags.lock_status as any
  } else if (tags.bridge_status) {
    operational.status = tags.bridge_status as any
  } else if (tags.operational_status) {
    operational.status = tags.operational_status as any
  }
  
  // Last updated
  if (tags.last_updated) {
    operational.lastUpdated = tags.last_updated
  } else if (tags.last_checked) {
    operational.lastUpdated = tags.last_checked
  } else if (tags.updated) {
    operational.lastUpdated = tags.updated
  }
  
  return Object.keys(operational).length > 0 ? operational : undefined
}

// Extract contact information
const extractContactInfo = (tags: Record<string, string>) => {
  const contact: EnhancedPOIData['contactInfo'] = {}
  
  // Phone numbers
  if (tags.phone) contact.phone = tags.phone
  else if (tags.contact_phone) contact.phone = tags.contact_phone
  else if (tags['contact:phone']) contact.phone = tags['contact:phone']
  
  // Email addresses
  if (tags.email) contact.email = tags.email
  else if (tags.contact_email) contact.email = tags.contact_email
  else if (tags['contact:email']) contact.email = tags['contact:email']
  
  // Websites
  if (tags.website) contact.website = tags.website
  else if (tags.contact_website) contact.website = tags.contact_website
  else if (tags['contact:website']) contact.website = tags['contact:website']
  else if (tags.url) contact.website = tags.url
  else if (tags.official_website) contact.website = tags.official_website
  
  // Radio channels
  if (tags.radio) contact.radioChannel = tags.radio
  else if (tags.contact_radio) contact.radioChannel = tags.contact_radio
  else if (tags['contact:radio']) contact.radioChannel = tags['contact:radio']
  else if (tags.vhf) contact.radioChannel = tags.vhf
  
  // Emergency contacts
  if (tags.emergency_phone) contact.emergencyContact = tags.emergency_phone
  else if (tags.emergency) contact.emergencyContact = tags.emergency
  else if (tags['contact:emergency']) contact.emergencyContact = tags['contact:emergency']
  
  return Object.keys(contact).length > 0 ? contact : undefined
}

// Extract services and amenities
const extractServices = (tags: Record<string, string>, _type: string) => {
  const services: EnhancedPOIData['services'] = {}
  
  // Common services
  if (tags.fuel) services.fuel = tags.fuel === 'yes'
  if (tags.water) services.water = tags.water === 'yes'
  if (tags.electricity) services.electricity = tags.electricity === 'yes'
  if (tags.pump_out) services.pumpOut = tags.pump_out === 'yes'
  if (tags.repair) services.repairs = tags.repair === 'yes'
  if (tags.provisions) services.provisions = tags.provisions === 'yes'
  if (tags.restaurant) services.restaurant = tags.restaurant === 'yes'
  if (tags.showers) services.showers = tags.showers === 'yes'
  if (tags.wifi) services.wifi = tags.wifi === 'yes'
  if (tags.parking) services.parking = tags.parking === 'yes'
  
  return Object.keys(services).length > 0 ? services : undefined
}

// Extract navigation information - comprehensive for all available data
const extractNavigationInfo = (tags: Record<string, string>, _type: string) => {
  const nav: EnhancedPOIData['navigationInfo'] = {}
  
  // Depth information - ALL variations
  const depthTags = [
    'depth', 'approach_depth', 'lock_depth', 'chamber_depth', 'min_depth', 'max_depth',
    'water_depth', 'channel_depth', 'fairway_depth', 'navigational_depth', 'operational_depth',
    'design_depth', 'construction_depth', 'maintenance_depth', 'dredged_depth'
  ]
  for (const tag of depthTags) {
    if (tags[tag] && !nav.depth) {
      nav.depth = parseFloat(tags[tag])
    }
  }
  
  // Approach depth - ALL variations
  const approachDepthTags = ['approach_depth', 'approach_water_depth', 'entrance_depth', 'access_depth']
  for (const tag of approachDepthTags) {
    if (tags[tag] && !nav.approachDepth) {
      nav.approachDepth = parseFloat(tags[tag])
    }
  }
  
  // Berth information - ALL variations
  const berthTags = ['berth_count', 'berths', 'berth_number', 'mooring_count', 'moorings', 'slip_count', 'slips']
  for (const tag of berthTags) {
    if (tags[tag] && !nav.berthCount) {
      nav.berthCount = parseInt(tags[tag])
    }
  }
  
  // Vessel length - ALL variations
  const lengthTags = [
    'max_vessel_length', 'lock_length', 'chamber_length', 'max_boat_length', 'max_ship_length',
    'vessel_length', 'boat_length', 'ship_length', 'max_length', 'length', 'chamber_size'
  ]
  for (const tag of lengthTags) {
    if (tags[tag] && !nav.maxVesselLength) {
      nav.maxVesselLength = parseFloat(tags[tag])
    }
  }
  
  // Type information - ALL variations for locks and bridges
  const lockTypeTags = [
    'lock_type', 'lock_mechanism', 'lock_operation', 'operation', 'mechanism', 'type',
    'lock_construction', 'lock_design', 'lock_system', 'operating_system', 'control_system'
  ]
  for (const tag of lockTypeTags) {
    if (tags[tag] && !nav.lockType) {
      nav.lockType = tags[tag]
    }
  }
  
  const bridgeTypeTags = [
    'bridge_type', 'bridge_construction', 'bridge_design', 'bridge_system', 'movement_type',
    'opening_type', 'span_type', 'structure_type', 'construction_type'
  ]
  for (const tag of bridgeTypeTags) {
    if (tags[tag] && !nav.bridgeType) {
      nav.bridgeType = tags[tag]
    }
  }
  
  // Navigation aids - ALL variations
  const aids = []
  const aidTags = [
    'light', 'beacon', 'buoy', 'radar', 'signal', 'horn', 'bell', 'whistle', 'fog_signal',
    'radio_beacon', 'gps', 'ais', 'vts', 'traffic_light', 'navigation_light', 'warning_light',
    'marker', 'daymark', 'nightmark', 'reflector', 'radar_reflector', 'sound_signal'
  ]
  for (const tag of aidTags) {
    if (tags[tag] && tags[tag] !== 'no' && tags[tag] !== 'false') {
      aids.push(tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    }
  }
  if (aids.length > 0) nav.navigationAids = aids
  
  // Hazards - ALL variations
  const hazards = []
  const hazardTags = [
    'shallow', 'obstruction', 'current', 'tide', 'wind', 'ice', 'fog', 'storm', 'weather',
    'restriction', 'limitation', 'danger', 'warning', 'caution', 'hazard', 'risk',
    'strong_current', 'tidal_current', 'wind_exposure', 'ice_formation', 'shallow_water',
    'narrow_channel', 'sharp_bend', 'blind_corner', 'traffic', 'congestion'
  ]
  for (const tag of hazardTags) {
    if (tags[tag] && tags[tag] !== 'no' && tags[tag] !== 'false') {
      hazards.push(tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    }
  }
  if (hazards.length > 0) nav.hazards = hazards
  
  return Object.keys(nav).length > 0 ? nav : undefined
}

// Extract additional information - comprehensive for all available data
const extractAdditionalInfo = (tags: Record<string, string>, _type: string) => {
  const additional: EnhancedPOIData['additionalInfo'] = {}
  
  // Description - ALL variations
  const descriptionTags = [
    'description', 'note', 'comment', 'summary', 'details', 'info', 'information',
    'remarks', 'notes', 'comments', 'text', 'content', 'about', 'overview'
  ]
  for (const tag of descriptionTags) {
    if (tags[tag] && !additional.description) {
      additional.description = tags[tag]
    }
  }
  
  // History - ALL variations
  const historyTags = [
    'history', 'historic', 'historical', 'heritage', 'built', 'constructed', 'established',
    'founded', 'opened', 'inaugurated', 'year', 'date', 'construction_date', 'opening_date'
  ]
  for (const tag of historyTags) {
    if (tags[tag] && !additional.history) {
      additional.history = tags[tag]
    }
  }
  
  // Fees - ALL variations
  const feeTags = [
    'fee', 'charge', 'cost', 'price', 'rate', 'tariff', 'toll', 'payment', 'costs',
    'pricing', 'charges', 'fees', 'tolls', 'rates', 'tariffs', 'lock_fee', 'bridge_fee',
    'passage_fee', 'transit_fee', 'usage_fee'
  ]
  for (const tag of feeTags) {
    if (tags[tag] && !additional.fees) {
      additional.fees = tags[tag]
    }
  }
  
  // Booking requirements - ALL variations
  const bookingTags = [
    'booking', 'reservation', 'appointment', 'advance_booking', 'pre_booking',
    'registration', 'permit_required', 'authorization', 'clearance_required'
  ]
  for (const tag of bookingTags) {
    if (tags[tag] && tags[tag] !== 'no' && tags[tag] !== 'false') {
      additional.bookingRequired = true
    }
  }
  
  // Advance notice - ALL variations
  const noticeTags = [
    'advance_notice', 'notice', 'advance_booking', 'advance_warning', 'prior_notice',
    'notification', 'warning_time', 'lead_time', 'booking_time', 'reservation_time'
  ]
  for (const tag of noticeTags) {
    if (tags[tag] && !additional.advanceNotice) {
      additional.advanceNotice = tags[tag]
    }
  }
  
  // Weather dependency - ALL variations
  const weatherTags = [
    'weather_dependent', 'weather', 'weather_restriction', 'weather_limitation',
    'wind_dependent', 'tide_dependent', 'seasonal', 'seasonal_operation'
  ]
  for (const tag of weatherTags) {
    if (tags[tag] && (tags[tag] === 'yes' || tags[tag] === 'true')) {
      additional.weatherDependent = true
    }
  }
  
  // Restrictions - ALL variations
  const restrictions = []
  const restrictionTags = [
    'restriction', 'limitation', 'constraint', 'prohibition', 'ban', 'forbidden',
    'no_entry', 'no_exit', 'closed', 'private', 'permit', 'authorization_required',
    'access_restricted', 'limited_access', 'restricted_access', 'controlled_access',
    'vessel_restriction', 'size_restriction', 'type_restriction', 'time_restriction',
    'seasonal_restriction', 'weather_restriction', 'tidal_restriction', 'wind_restriction'
  ]
  for (const tag of restrictionTags) {
    if (tags[tag] && tags[tag] !== 'no' && tags[tag] !== 'false') {
      if (tag === 'no_entry') restrictions.push('No entry')
      else if (tag === 'no_exit') restrictions.push('No exit')
      else if (tag === 'private') restrictions.push('Private access')
      else if (tag === 'permit') restrictions.push('Permit required')
      else if (tag === 'closed') restrictions.push('Closed')
      else restrictions.push(tag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    }
  }
  if (restrictions.length > 0) additional.restrictions = restrictions
  
  return Object.keys(additional).length > 0 ? additional : undefined
}

// Extract external links
const extractExternalLinks = (tags: Record<string, string>) => {
  const links: EnhancedPOIData['externalLinks'] = {}
  
  // Official websites
  if (tags.website) links.officialWebsite = tags.website
  else if (tags.url) links.officialWebsite = tags.url
  else if (tags.official_website) links.officialWebsite = tags.official_website
  else if (tags.homepage) links.officialWebsite = tags.homepage
  
  // Booking systems
  if (tags.booking_url) links.bookingSystem = tags.booking_url
  else if (tags.booking) links.bookingSystem = tags.booking
  else if (tags.reservation_url) links.bookingSystem = tags.reservation_url
  
  // Live status
  if (tags.status_url) links.liveStatus = tags.status_url
  else if (tags.status) links.liveStatus = tags.status
  else if (tags.live_status) links.liveStatus = tags.live_status
  
  // Weather information
  if (tags.weather_url) links.weatherInfo = tags.weather_url
  else if (tags.weather) links.weatherInfo = tags.weather
  
  // Tide information
  if (tags.tide_url) links.tideInfo = tags.tide_url
  else if (tags.tide) links.tideInfo = tags.tide
  else if (tags.tides) links.tideInfo = tags.tides
  
  return Object.keys(links).length > 0 ? links : undefined
}

// Calculate data confidence based on available information
const calculateDataConfidence = (tags: Record<string, string>): 'high' | 'medium' | 'low' => {
  let score = 0
  
  // High confidence indicators
  if (tags.phone) score += 2
  if (tags.website) score += 2
  if (tags.opening_hours) score += 2
  if (tags.maxheight || tags.maxwidth) score += 2
  if (tags.last_updated) score += 1
  
  // Medium confidence indicators
  if (tags.email) score += 1
  if (tags.description) score += 1
  if (tags.depth || tags.width) score += 1
  
  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

// Format dimensions for display
export const formatDimension = (value: number, unit: string = 'm'): string => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${unit}`
  }
  return `${value.toFixed(1)}${unit}`
}

// Format clearance information for display
export const formatClearanceInfo = (clearance: EnhancedPOIData['boatClearance']): string[] => {
  const info: string[] = []
  
  if (clearance?.height) {
    info.push(`Height: ${formatDimension(clearance.height)}`)
  }
  if (clearance?.width) {
    info.push(`Width: ${formatDimension(clearance.width)}`)
  }
  if (clearance?.maxLength) {
    info.push(`Max Length: ${formatDimension(clearance.maxLength)}`)
  }
  if (clearance?.maxDraft) {
    info.push(`Max Draft: ${formatDimension(clearance.maxDraft)}`)
  }
  if (clearance?.maxDisplacement) {
    info.push(`Max Displacement: ${clearance.maxDisplacement.toFixed(0)}t`)
  }
  
  return info
}

// Format operational status
export const formatOperationalStatus = (status?: string): { text: string; color: string } => {
  switch (status) {
    case 'open':
      return { text: 'Open', color: 'text-green-600' }
    case 'closed':
      return { text: 'Closed', color: 'text-red-600' }
    case 'maintenance':
      return { text: 'Maintenance', color: 'text-yellow-600' }
    default:
      return { text: 'Unknown', color: 'text-gray-600' }
  }
}

// Format vessel permissions
export const formatVesselPermissions = (operational: EnhancedPOIData['operationalInfo']): string[] => {
  const permissions: string[] = []
  
  if (operational?.motorboatAllowed) permissions.push('Motorboats')
  if (operational?.sailingBoatAllowed) permissions.push('Sailing boats')
  if (operational?.commercialVessels) permissions.push('Commercial vessels')
  
  return permissions
}

// Get POI type display name
export const getPOITypeDisplayName = (type: string): string => {
  switch (type) {
    case 'lock': return 'Lock'
    case 'bridge': return 'Bridge'
    case 'harbor': return 'Harbor'
    case 'marina': return 'Marina'
    case 'report': return 'Alert'
    case 'waypoint': return 'Waypoint'
    case 'buoy': return 'Buoy'
    case 'beacon': return 'Beacon'
    case 'light': return 'Light'
    case 'anchorage': return 'Anchorage'
    default: return 'Point of Interest'
  }
}

// Get POI icon based on type
export const getPOITypeIcon = (type: string): string => {
  switch (type) {
    case 'lock': return '🚦'
    case 'bridge': return '🌉'
    case 'harbor': return '⚓'
    case 'marina': return '🏖️'
    case 'report': return '🚨'
    case 'waypoint': return '📍'
    case 'buoy': return '🔴'
    case 'beacon': return '🏮'
    case 'light': return '💡'
    case 'anchorage': return '⚓'
    default: return '📍'
  }
}
