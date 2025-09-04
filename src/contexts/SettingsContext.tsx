import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Settings {
  voiceGuidance: boolean
  autoNightMode: boolean
  units: string
  language: string
  mapStyle: string
  mapLabels: boolean
  // Boat profile settings
  boatLength: number
  boatWidth: number
  boatSpeed: number
  boatHeight: number
  boatDraught: number
  // Navigation settings
  autoReroute: boolean
  speedUnits: string
  // Notification settings
  weatherAlerts: boolean
  hazardReports: boolean
  navigationAlerts: boolean
  // Privacy settings
  locationSharing: boolean
  dataCollection: boolean
  offlineMode: boolean
  // General settings
  autoUpdate: boolean
}

interface SettingsContextType {
  settings: Settings
  updateSetting: (key: keyof Settings, value: any) => void
  updateSettings: (newSettings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  voiceGuidance: true,
  autoNightMode: true,
  units: 'metric',
  language: 'en',
  mapStyle: 'standard',
  mapLabels: true,
  boatLength: 5,
  boatWidth: 1.5,
  boatSpeed: 7,
  boatHeight: 2.0,
  boatDraught: 0.7,
  autoReroute: true,
  speedUnits: 'knots',
  weatherAlerts: true,
  hazardReports: true,
  navigationAlerts: true,
  locationSharing: false,
  dataCollection: true,
  offlineMode: true,
  autoUpdate: true,
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // Load settings from localStorage on initialization
    const savedSettings = localStorage.getItem('vaarpro-settings')
    if (savedSettings) {
      try {
        return { ...defaultSettings, ...JSON.parse(savedSettings) }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error)
        return defaultSettings
      }
    }
    return defaultSettings
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('vaarpro-settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const value: SettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}
