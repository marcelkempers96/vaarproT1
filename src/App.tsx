import { Routes, Route } from 'react-router-dom'
import { SettingsProvider } from './contexts/SettingsContext'
import NavigationLayout from './components/layout/NavigationLayout'
import NavigationPage from './pages/NavigationPage'
import WeatherPage from './pages/WeatherPage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'

function App() {
  return (
    <SettingsProvider>
      <div className="min-h-screen bg-base-50">
        <Routes>
          <Route path="/" element={<NavigationLayout />}>
            <Route index element={<NavigationPage />} />
            <Route path="weather" element={<WeatherPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </div>
    </SettingsProvider>
  )
}

export default App
