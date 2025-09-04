import React, { useState } from 'react'
import { Cloud, Wind, Droplets, Thermometer, Sun, Moon, AlertTriangle } from 'lucide-react'

interface WeatherData {
  temperature: number
  windSpeed: number
  windDirection: number
  humidity: number
  visibility: number
  waveHeight: number
  tideLevel: number
  forecast: Array<{
    time: string
    temperature: number
    windSpeed: number
    windDirection: number
    description: string
    icon: string
  }>
}

const WeatherPage: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | '24h' | '7d'>('current')

  // Sample weather data
  const weatherData: WeatherData = {
    temperature: 18,
    windSpeed: 12,
    windDirection: 245,
    humidity: 65,
    visibility: 15,
    waveHeight: 0.8,
    tideLevel: 1.2,
    forecast: [
      { time: 'Now', temperature: 18, windSpeed: 12, windDirection: 245, description: 'Partly Cloudy', icon: '⛅' },
      { time: '12:00', temperature: 20, windSpeed: 15, windDirection: 250, description: 'Sunny', icon: '☀️' },
      { time: '15:00', temperature: 22, windSpeed: 18, windDirection: 255, description: 'Clear', icon: '☀️' },
      { time: '18:00', temperature: 19, windSpeed: 14, windDirection: 240, description: 'Partly Cloudy', icon: '⛅' },
      { time: '21:00', temperature: 16, windSpeed: 10, windDirection: 235, description: 'Clear', icon: '🌙' }
    ]
  }

  const getWindDirectionText = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }

  const getWindDirectionArrow = (degrees: number): string => {
    return `rotate(${degrees}deg)`
  }

  const getWeatherIcon = (description: string): string => {
    const icons: { [key: string]: string } = {
      'Sunny': '☀️',
      'Partly Cloudy': '⛅',
      'Cloudy': '☁️',
      'Rain': '🌧️',
      'Clear': '🌙',
      'Fog': '🌫️'
    }
    return icons[description] || '🌤️'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 pt-16 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-marine-blue mb-2">Marine Weather</h1>
          <p className="text-gray-600">Current conditions and forecasts for safe navigation</p>
        </div>

        {/* Current Weather Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-marine-blue mb-4 flex items-center gap-2">
            <Cloud className="text-blue-500" />
            Current Conditions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.temperature}°C</div>
              <div className="text-sm text-gray-600">Temperature</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <Wind className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.windSpeed} knots</div>
              <div className="text-sm text-gray-600">Wind Speed</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.humidity}%</div>
              <div className="text-sm text-gray-600">Humidity</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <Sun className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{weatherData.visibility} km</div>
              <div className="text-sm text-gray-600">Visibility</div>
            </div>
          </div>
        </div>

        {/* Wind and Marine Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Wind Direction */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-marine-blue mb-4 flex items-center gap-2">
              <Wind className="text-green-500" />
              Wind Direction
            </h3>
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: getWindDirectionArrow(weatherData.windDirection) }}
                >
                  <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[40px] border-l-transparent border-r-transparent border-b-red-500"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">N</span>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                  <span className="text-sm font-semibold text-gray-600">N</span>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  <span className="text-sm font-semibold text-gray-600">S</span>
                </div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-semibold text-gray-600">W</span>
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                  <span className="text-sm font-semibold text-gray-600">E</span>
                </div>
              </div>
              <div className="text-lg font-semibold text-gray-800">
                {getWindDirectionText(weatherData.windDirection)} ({weatherData.windDirection}°)
              </div>
            </div>
          </div>

          {/* Marine Conditions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-marine-blue mb-4 flex items-center gap-2">
              <Droplets className="text-blue-500" />
              Marine Conditions
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Wave Height</span>
                <span className="font-semibold text-gray-800">{weatherData.waveHeight}m</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Tide Level</span>
                <span className="font-semibold text-gray-800">{weatherData.tideLevel}m</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Current Speed</span>
                <span className="font-semibold text-gray-800">2.5 knots</span>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-marine-blue mb-4">24-Hour Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {weatherData.forecast.map((forecast, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-2">{getWeatherIcon(forecast.description)}</div>
                <div className="font-semibold text-gray-800">{forecast.time}</div>
                <div className="text-lg font-bold text-gray-800">{forecast.temperature}°C</div>
                <div className="text-sm text-gray-600">{forecast.windSpeed} knots</div>
                <div className="text-xs text-gray-500 mt-1">{forecast.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Alerts */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-800">Weather Alerts</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-yellow-700">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Strong winds expected after 18:00 (15-20 knots)</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-700">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Reduced visibility due to fog in early morning hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherPage







