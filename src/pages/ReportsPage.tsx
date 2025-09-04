import React, { useState } from 'react'
import { AlertTriangle, Fuel, Anchor, Lock, MapPin, Camera, Send, ThumbsUp, MessageCircle, Clock, User, Navigation, Settings } from 'lucide-react'

interface Report {
  id: string
  type: 'hazard' | 'fuel' | 'harbor' | 'bridge' | 'lock'
  title: string
  description: string
  location: string
  coordinates: [number, number]
  timestamp: Date
  author: string
  upvotes: number
  confirmed: number
  status: 'active' | 'resolved' | 'pending'
  image?: string
}

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'submit'>('reports')
  const [selectedType, setSelectedType] = useState<Report['type']>('hazard')
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportLocation, setReportLocation] = useState('')

  // Sample reports
  const sampleReports: Report[] = [
    {
      id: '1',
      type: 'hazard',
      title: 'Shallow Water Near Bridge',
      description: 'Water depth less than 1.5m for about 50m stretch. Marked with temporary buoys.',
      location: 'Amsterdam Canal, near Central Bridge',
      coordinates: [52.3680, 4.9000],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      author: 'Captain_Sarah',
      upvotes: 12,
      confirmed: 8,
      status: 'active'
    },
    {
      id: '2',
      type: 'fuel',
      title: 'Fuel Station Temporarily Closed',
      description: 'Maintenance work in progress. Expected to reopen tomorrow morning.',
      location: 'Amsterdam Marina Fuel Dock',
      coordinates: [52.3702, 4.8952],
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      author: 'Marina_Staff',
      upvotes: 5,
      confirmed: 3,
      status: 'active'
    },
    {
      id: '3',
      type: 'bridge',
      title: 'Bridge Opening Schedule Changed',
      description: 'Bridge now opens every 30 minutes instead of hourly. New schedule posted.',
      location: 'Central Bridge, Amsterdam',
      coordinates: [52.3680, 4.9000],
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      author: 'Bridge_Operator',
      upvotes: 18,
      confirmed: 15,
      status: 'active'
    },
    {
      id: '4',
      type: 'harbor',
      title: 'New Docking Area Available',
      description: 'Additional 10 berths opened at the north end of the marina. First come, first served.',
      location: 'Amsterdam Marina North',
      coordinates: [52.3676, 4.9041],
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      author: 'Marina_Manager',
      upvotes: 25,
      confirmed: 20,
      status: 'active'
    }
  ]

  const getTypeIcon = (type: Report['type']) => {
    const icons = {
      hazard: '⚠️',
      fuel: '⛽',
      harbor: '⚓',
      bridge: '🌉',
      lock: '🧱'
    }
    return icons[type]
  }

  const getTypeColor = (type: Report['type']) => {
    const colors = {
      hazard: 'bg-red-100 text-red-800 border-red-200',
      fuel: 'bg-green-100 text-green-800 border-green-200',
      harbor: 'bg-blue-100 text-blue-800 border-blue-200',
      bridge: 'bg-purple-100 text-purple-800 border-purple-200',
      lock: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[type]
  }

  const handleSubmitReport = () => {
    // Handle report submission
    console.log('Submitting report:', { selectedType, reportTitle, reportDescription, reportLocation })
    // Reset form
    setReportTitle('')
    setReportDescription('')
    setReportLocation('')
    setActiveTab('reports')
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-marine-blue mb-2">Reports</h1>
          <p className="text-gray-600">View and submit navigation reports</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-marine-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              View Reports
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'submit'
                  ? 'bg-white text-marine-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Submit Report
            </button>
          </div>
        </div>

        {/* Reports List */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {sampleReports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getTypeIcon(report.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-600">{report.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                      {report.type}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {report.timestamp.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{report.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User size={16} />
                      {report.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={16} />
                      {report.upvotes} upvotes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={16} />
                      {report.confirmed} confirmed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-marine-blue transition-colors">
                      <ThumbsUp size={16} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-marine-blue transition-colors">
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Report Form */}
        {activeTab === 'submit' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-marine-blue mb-6">Submit New Report</h2>
            
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(['hazard', 'fuel', 'harbor', 'bridge', 'lock'] as Report['type'][]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedType === type
                          ? 'border-marine-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{getTypeIcon(type)}</div>
                      <div className="text-sm font-medium capitalize">{type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Brief description of the issue or update"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  required
                />
              </div>

              {/* Report Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide detailed information about the situation..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="Describe the location (e.g., 'Near Central Bridge, Amsterdam Canal')"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marine-blue focus:border-transparent"
                  required
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-marine-blue transition-colors cursor-pointer">
                  <Camera size={32} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload photo or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitReport}
                disabled={!reportTitle || !reportDescription || !reportLocation}
                className="w-full bg-marine-blue text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Submit Report
              </button>
            </div>
          </div>
        )}
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
            className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium shadow-lg text-sm"
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
      </div>
    </div>
  )
}

export default ReportsPage
