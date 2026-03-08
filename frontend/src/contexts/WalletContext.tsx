import React, { createContext, useContext, useState, useCallback } from "react"
import type { UserProfile } from "@/types"
import { mockUser } from "@/data/mock"

interface WalletContextType {
  isConnected: boolean
  isConnecting: boolean
  user: UserProfile | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setUser(mockUser)
    setIsConnected(true)
    setIsConnecting(false)
  }, [])

  const disconnectWallet = useCallback(() => {
    setUser(null)
    setIsConnected(false)
  }, [])

  return (
    <WalletContext.Provider
      value={{ isConnected, isConnecting, user, connectWallet, disconnectWallet }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
