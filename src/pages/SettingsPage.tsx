import React from 'react'
import { Settings as SettingsIcon, Navigation, Map, Bell, Shield, Globe, User, Palette, Smartphone, AlertTriangle } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

interface SettingsSection {
  id: string
  title: string
  icon: React.ComponentType<any>
  settings: Array<{
    id: string
    label: string
    description: string
    type: 'toggle' | 'select' | 'input' | 'slider'
    value: any
    options?: Array<{ value: string; label: string }>
  }>
}

const SettingsPage: React.FC = () => {
  const { settings, updateSetting } = useSettings()

  const settingsSections: SettingsSection[] = [
    {
      id: 'boat',
      title: 'Boat Profile',
      icon: User,
      settings: [
        {
          id: 'boatLength',
          label: 'Boat Length (m)',
          description: 'Length of your boat in meters',
          type: 'input',
          value: settings.boatLength
        },
        {
          id: 'boatWidth',
          label: 'Boat Width/Beam (m)',
          description: 'Width of your boat in meters',
          type: 'input',
          value: settings.boatWidth
        },
        {
          id: 'boatSpeed',
          label: 'Cruising Speed (km/h)',
          description: 'Your typical cruising speed for ETA calculations',
          type: 'input',
          value: settings.boatSpeed
        },
        {
          id: 'boatHeight',
          label: 'Boat Height (m)',
          description: 'Height of your boat above waterline',
          type: 'input',
          value: settings.boatHeight
        },
        {
          id: 'boatDraught',
          label: 'Boat Draught (m)',
          description: 'Depth below waterline',
          type: 'input',
          value: settings.boatDraught
        }
      ]
    },
    {
      id: 'navigation',
      title: 'Navigation',
      icon: Navigation,
      settings: [
        {
          id: 'voiceGuidance',
          label: 'Voice Guidance',
          description: 'Enable turn-by-turn voice instructions',
          type: 'toggle',
          value: settings.voiceGuidance
        },
        {
          id: 'autoReroute',
          label: 'Auto Reroute',
          description: 'Automatically find alternative routes',
          type: 'toggle',
          value: true
        },
        {
          id: 'speedUnits',
          label: 'Speed Units',
          description: 'Choose your preferred speed measurement',
          type: 'select',
          value: 'knots',
          options: [
            { value: 'knots', label: 'Knots' },
            { value: 'kmh', label: 'Kilometers per hour' },
            { value: 'mph', label: 'Miles per hour' }
          ]
        }
      ]
    },
    {
      id: 'display',
      title: 'Display & Maps',
      icon: Map,
      settings: [
        {
          id: 'autoNightMode',
          label: 'Auto Night Mode',
          description: 'Automatically switch to dark theme at sunset',
          type: 'toggle',
          value: settings.autoNightMode
        },
        {
          id: 'mapStyle',
          label: 'Map Style',
          description: 'Choose your preferred map appearance',
          type: 'select',
          value: settings.mapStyle,
          options: [
            { value: 'standard', label: 'Standard (nlmaps.nl)' },
            { value: 'satellite', label: 'Satellite' },
            { value: 'terrain', label: 'Terrain' }
          ]
        },
        {
          id: 'mapLabels',
          label: 'Map Labels',
          description: 'Show or hide map labels and information',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          id: 'weatherAlerts',
          label: 'Weather Alerts',
          description: 'Receive notifications about weather changes',
          type: 'toggle',
          value: true
        },
        {
          id: 'hazardReports',
          label: 'Hazard Reports',
          description: 'Get notified about new hazard reports nearby',
          type: 'toggle',
          value: true
        },
        {
          id: 'navigationAlerts',
          label: 'Navigation Alerts',
          description: 'Receive alerts during navigation',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      settings: [
        {
          id: 'locationSharing',
          label: 'Location Sharing',
          description: 'Share your location with other users',
          type: 'toggle',
          value: false
        },
        {
          id: 'dataCollection',
          label: 'Data Collection',
          description: 'Allow anonymous usage data collection',
          type: 'toggle',
          value: true
        },
        {
          id: 'offlineMode',
          label: 'Offline Mode',
          description: 'Enable offline map and navigation',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'general',
      title: 'General',
      icon: SettingsIcon,
      settings: [
        {
          id: 'language',
          label: 'Language',
          description: 'Choose your preferred language',
          type: 'select',
          value: 'en',
          options: [
            { value: 'en', label: 'English' },
            { value: 'nl', label: 'Nederlands' },
            { value: 'de', label: 'Deutsch' },
            { value: 'fr', label: 'Français' }
          ]
        },
        {
          id: 'units',
          label: 'Units',
          description: 'Choose your preferred measurement system',
          type: 'select',
          value: 'metric',
          options: [
            { value: 'metric', label: 'Metric (km, m, °C)' },
            { value: 'imperial', label: 'Imperial (mi, ft, °F)' }
          ]
        },
        {
          id: 'autoUpdate',
          label: 'Auto Update',
          description: 'Automatically update maps and data',
          type: 'toggle',
          value: true
        }
      ]
    }
  ]

  const handleSettingChange = (_sectionId: string, settingId: string, value: any) => {
    updateSetting(settingId as keyof typeof settings, value)
  }

  const renderSettingControl = (setting: any) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={setting.value}
              onChange={(e) => handleSettingChange('', setting.id, e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-marine-blue"></div>
          </label>
        )
      
      case 'select':
        return (
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-marine-blue focus:border-marine-blue block w-full p-2.5"
            value={setting.value}
            onChange={(e) => handleSettingChange('', setting.id, e.target.value)}
          >
            {setting.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'input':
        // Check if this is a boat profile setting to use number input
        const isBoatSetting = setting.id.startsWith('boat')
        return (
          <input
            type={isBoatSetting ? 'number' : 'text'}
            min={isBoatSetting ? (setting.id === 'boatLength' ? 1 : setting.id === 'boatWidth' ? 0.5 : setting.id === 'boatSpeed' ? 1 : 0.5) : undefined}
            max={isBoatSetting ? (setting.id === 'boatSpeed' ? 50 : 20) : undefined}
            step={isBoatSetting ? (setting.id === 'boatSpeed' ? 0.5 : 0.1) : undefined}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-marine-blue focus:border-marine-blue block w-full p-2.5"
            value={setting.value}
            onChange={(e) => handleSettingChange('', setting.id, isBoatSetting ? parseFloat(e.target.value) || 0 : e.target.value)}
          />
        )
      
      case 'slider':
        return (
          <input
            type="range"
            min="0"
            max="100"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            value={setting.value}
            onChange={(e) => handleSettingChange('', setting.id, parseInt(e.target.value))}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-marine-blue mb-2">Settings</h1>
          <p className="text-gray-600">Customize your VaarPro experience</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-marine-blue to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Icon className="text-white" size={24} />
                    <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {section.settings.map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{setting.label}</div>
                          <div className="text-sm text-gray-600">{setting.description}</div>
                        </div>
                        <div className="ml-4">
                          {renderSettingControl(setting)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-marine-blue mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              <Globe className="text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Download Offline Maps</div>
                <div className="text-sm text-gray-600">Save maps for offline use</div>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
              <Smartphone className="text-green-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Export Settings</div>
                <div className="text-sm text-gray-600">Backup your preferences</div>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
              <User className="text-purple-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Account Settings</div>
                <div className="text-sm text-gray-600">Manage your profile</div>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors">
              <Palette className="text-orange-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Customize Theme</div>
                <div className="text-sm text-gray-600">Personalize appearance</div>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>VaarPro v1.0.0</p>
          <p className="mt-1">Professional Marine Navigation</p>
        </div>
      </div>

      {/* Bottom Navigation Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-gradient-to-br from-blue-600 to-cyan-600 backdrop-blur-md border-t border-white/30 shadow-2xl">
        <div className="flex items-center justify-center gap-4 px-4 sm:px-6 py-3 sm:py-4">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-white text-sm"
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
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium shadow-lg text-sm"
          >
            <SettingsIcon size={20} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
