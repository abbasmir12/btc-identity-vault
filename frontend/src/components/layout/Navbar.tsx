import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Menu, X, Wallet, LogOut, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/WalletContext"

interface NavbarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "issuers", label: "Issuers" },
  { id: "verify", label: "Verify" },
]

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { isConnected, user, connectWallet, disconnectWallet, isConnecting } = useWallet()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="p-1.5 rounded-lg btc-gradient">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg hidden sm:block">BTC Identity Vault</span>
          </button>

          {/* Desktop Nav */}
          {isConnected && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isConnected && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass glass-hover transition-all"
                >
                  <div className="w-6 h-6 rounded-full btc-gradient flex items-center justify-center">
                    <span className="text-xs font-bold text-black">
                      {user.btcName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user.btcName}</span>
                </button>

                <AnimatePresence>
                  {showWalletMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3"
                    >
                      <div className="text-center pb-3 border-b border-border">
                        <div className="w-12 h-12 rounded-full btc-gradient flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold text-black">
                            {user.btcName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-semibold">{user.btcName}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                          <span className="text-xs text-muted-foreground">STX Address</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono">{truncateAddress(user.stxAddress)}</span>
                            <button className="p-1 rounded hover:bg-white/5">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                          <span className="text-xs text-muted-foreground">BTC Address</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono">{truncateAddress(user.address)}</span>
                            <button className="p-1 rounded hover:bg-white/5">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <a
                        href={`https://explorer.hiro.so/address/${user.stxAddress}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on Explorer
                      </a>

                      <button
                        onClick={() => { disconnectWallet(); setShowWalletMenu(false); onNavigate("landing"); }}
                        className="flex items-center gap-2 w-full p-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button onClick={connectWallet} disabled={isConnecting} size="sm">
                <Wallet className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}

            {/* Mobile menu button */}
            {isConnected && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {showMobileMenu && isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 space-y-1"
            >
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setShowMobileMenu(false); }}
                  className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
