import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { UserProfile } from "@/types"
import * as stacks from "@/lib/stacks"

interface WalletContextType {
  isConnected: boolean
  isConnecting: boolean
  user: UserProfile | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  address: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  // Check if user is already signed in on mount
  useEffect(() => {
    if (stacks.isSignedIn()) {
      const userData = stacks.getUserData()
      const userAddress = stacks.getAddress()
      
      if (userData && userAddress) {
        setAddress(userAddress)
        setIsConnected(true)
        
        // Fetch identity from blockchain
        loadUserProfile(userAddress)
      }
    }
  }, [])

  const loadUserProfile = async (userAddress: string) => {
    try {
      const identity = await stacks.getIdentity(userAddress)
      
      if (identity && identity.value?.value) {
        // User has registered identity - unwrap optional → tuple
        const data = identity.value.value
        setUser({
          btcName: data['btc-name'].value,
          address: userAddress,
          stxAddress: userAddress,
          credentialCount: data['credential-count'].value,
          verificationCount: 0,
          joinedDate: new Date(parseInt(data['registered-at'].value) * 10 * 60 * 1000).toISOString().split('T')[0],
        })
      } else {
        // User connected but not registered
        setUser({
          btcName: '',
          address: userAddress,
          stxAddress: userAddress,
          credentialCount: 0,
          verificationCount: 0,
          joinedDate: new Date().toISOString().split('T')[0],
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Set basic user data even if blockchain fetch fails
      setUser({
        btcName: '',
        address: userAddress,
        stxAddress: userAddress,
        credentialCount: 0,
        verificationCount: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      })
    }
  }

  const connectWallet = useCallback(async () => {
    setIsConnecting(true)
    try {
      await stacks.connectWallet()
      const userAddress = stacks.getAddress()
      
      if (userAddress) {
        setAddress(userAddress)
        setIsConnected(true)
        await loadUserProfile(userAddress)
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    stacks.disconnectWallet()
    setUser(null)
    setAddress(null)
    setIsConnected(false)
  }, [])

  return (
    <WalletContext.Provider
      value={{ isConnected, isConnecting, user, connectWallet, disconnectWallet, address }}
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
