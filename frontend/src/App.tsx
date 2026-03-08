import { useState, useEffect } from 'react'
import './App.css'
import { WalletProvider, useWallet } from '@/contexts/WalletContext'
import Navbar from '@/components/layout/Navbar'
import LandingPage from '@/pages/LandingPage'
import DashboardPage from '@/pages/DashboardPage'
import IssuersPage from '@/pages/IssuersPage'
import VerifyPage from '@/pages/VerifyPage'

function AppContent() {
  const { isConnected } = useWallet()
  const [currentPage, setCurrentPage] = useState('landing')

  // Navigate to dashboard when wallet connects
  useEffect(() => {
    if (isConnected && currentPage === 'landing') {
      setCurrentPage('dashboard')
    }
    if (!isConnected && currentPage !== 'landing') {
      setCurrentPage('landing')
    }
  }, [isConnected, currentPage])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'issuers':
        return <IssuersPage />
      case 'verify':
        return <VerifyPage />
      default:
        return <LandingPage />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {currentPage !== 'landing' && (
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      )}
      {currentPage === 'landing' && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>
      )}
      {renderPage()}
    </div>
  )
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  )
}

export default App
