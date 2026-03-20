import { useState, useEffect, lazy, Suspense } from 'react'
import './App.css'
import { WalletProvider, useWallet } from '@/contexts/WalletContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Navbar from '@/components/layout/Navbar'
import LandingPage from '@/pages/LandingPage'

// Lazy load heavy pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const IssuersPage = lazy(() => import('@/pages/IssuersPage'))
const VerifyPage = lazy(() => import('@/pages/VerifyPage'))

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

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
        return (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        )
      case 'issuers':
        return (
          <Suspense fallback={<PageLoader />}>
            <IssuersPage />
          </Suspense>
        )
      case 'verify':
        return (
          <Suspense fallback={<PageLoader />}>
            <VerifyPage />
          </Suspense>
        )
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
    <ErrorBoundary>
      <WalletProvider>
        <AppContent />
      </WalletProvider>
    </ErrorBoundary>
  )
}

export default App
