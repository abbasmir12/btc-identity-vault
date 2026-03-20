import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, CheckCircle, ExternalLink, Building2, Shield, Users, 
  ArrowRight, Filter, Award, X, Send, Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import RegisterIssuerDialog from "@/components/RegisterIssuerDialog"
import IssueCredentialDialog from "@/components/IssueCredentialDialog"
import { useWallet } from "@/contexts/WalletContext"
import { getIssuers, getIssuerAddresses, getIssuerDetails, requestCredential } from "@/lib/stacks"

export default function IssuersPage() {
  const { address } = useWallet()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [selectedIssuerAddress] = useState<string>("")
  const [requestDialogIssuer, setRequestDialogIssuer] = useState<any>(null)
  const [requestSent, setRequestSent] = useState(false)
  const [requestPending, setRequestPending] = useState(false)
  const [issuerStats, setIssuerStats] = useState<any>(null)
  const [issuers, setIssuers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadIssuers = async () => {
      if (!address) {
        setIssuers([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Get stats
        const stats = await getIssuers()
        if (stats) {
          setIssuerStats(stats)
        }

        // Get issuer addresses (first 20)
        const addressesResult = await getIssuerAddresses(0, 20)
        
        if (addressesResult?.success) {
          const resultValue = addressesResult.value.value
          const addresses = resultValue?.addresses?.value || []
          
          if (addresses && addresses.length > 0) {
            // Fetch details for each issuer
            const issuerDetails = await Promise.all(
            addresses.map(async (addr: any) => {
              const details = await getIssuerDetails(addr.value)
              if (details?.value?.value) {
                const issuerData = details.value.value
                return {
                  id: addr.value, // Add unique ID for React key
                  address: addr.value,
                  name: issuerData.name.value,
                  type: issuerData['issuer-type'].value,
                  verified: issuerData['is-verified'].value,
                  suspended: issuerData['is-suspended'].value,
                  credentialsIssued: parseInt(issuerData['credentials-issued'].value),
                  registeredAt: parseInt(issuerData['registered-at'].value),
                  metadataUrl: issuerData['metadata-url'].value
                }
              }
              return null
            })
          )
          
            setIssuers(issuerDetails.filter(Boolean))
          }
        }
      } catch (error) {
        console.error('Failed to load issuers:', error)
        setIssuers([])
      }
      setLoading(false)
    }

    loadIssuers()
  }, [address])

  const types = ["all", "Education", "Employment", "Government", "Certification", "Healthcare"]

  const filteredIssuers = issuers.filter((issuer) => {
    const matchesSearch = issuer.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === "all" || issuer.type === selectedType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1">
            Trusted <span className="btc-text-gradient">Issuers</span>
          </h1>
          <p className="text-muted-foreground">
            Verified organizations that can issue credentials to your vault
          </p>
          {issuerStats && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>{issuerStats.value?.['total-issuers']?.value || 0} registered issuers • {issuerStats.value?.['total-issued']?.value || 0} credentials issued</span>
            </div>
          )}
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search issuers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {types.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedType === type
                  ? "bg-primary text-black"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "all" ? "All Types" : type}
            </button>
          ))}
        </div>

        {/* Issuers Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading issuers...</p>
          </div>
        ) : filteredIssuers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 rounded-2xl glass"
          >
            <Building2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {issuerStats?.value?.['total-issuers']?.value > 0 && issuers.length === 0 && !searchQuery && selectedType === "all"
                ? "No issuers registered yet" 
                : "No issuers found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {!address 
                ? "Connect your wallet to view issuers"
                : searchQuery || selectedType !== "all"
                ? "Try adjusting your search or filters"
                : "Be the first to register as an issuer"}
            </p>
            {address && (
              <Button onClick={() => setRegisterDialogOpen(true)}>
                <Building2 className="w-4 h-4 mr-2" />
                Register as Issuer
              </Button>
            )}
          </motion.div>
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIssuers.map((issuer, i) => (
            <motion.div
              key={issuer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group rounded-2xl glass glass-hover p-6 cursor-pointer transition-all duration-300"
            >
              {/* Issuer header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {issuer.name}
                      </h3>
                      {issuer.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-1">{issuer.type}</Badge>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{issuer.credentialsIssued.toLocaleString()} issued</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/5 mb-4">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-mono text-muted-foreground truncate">
                  {issuer.address}
                </span>
              </div>

              {/* Action */}
              {address === issuer.address ? (
                <div className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Your Organization</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full group-hover:border-primary/50 group-hover:text-primary transition-colors"
                  onClick={() => { setRequestDialogIssuer(issuer); setRequestSent(false) }}
                  disabled={!address}
                >
                  Request Credential
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
        )}

        {/* Become an Issuer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 rounded-2xl glass p-8 sm:p-12 text-center"
        >
          <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Become a Trusted Issuer</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Organizations can register as credential issuers on the Bitcoin Identity Vault. 
            Issue verifiable credentials backed by Stacks smart contracts.
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={() => setRegisterDialogOpen(true)} disabled={!address}>
              Apply as Issuer
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {address && (
              <Button size="lg" variant="outline" onClick={() => setIssueDialogOpen(true)}>
                <Award className="w-4 h-4 mr-2" />
                Issue Credential
              </Button>
            )}
          </div>
          {!address && (
            <p className="text-xs text-muted-foreground mt-3">
              Connect your wallet to register as an issuer
            </p>
          )}
        </motion.div>
      </div>

      <RegisterIssuerDialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen} />
      <IssueCredentialDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen} defaultRecipient={selectedIssuerAddress} />

      {/* Request Credential Dialog */}
      <AnimatePresence>
        {requestDialogIssuer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRequestDialogIssuer(null)} />
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Request Credential</h2>
                </div>
                <button onClick={() => setRequestDialogIssuer(null)} className="p-1.5 rounded-lg hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50 mb-4">
                <p className="text-sm font-medium">{requestDialogIssuer.name}</p>
                <p className="text-xs text-muted-foreground">{requestDialogIssuer.type} · {requestDialogIssuer.address.slice(0, 12)}...</p>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Your wallet address will be shared with this issuer. They will review your request and issue a credential on-chain if approved.
              </p>

              <div className="p-3 rounded-lg bg-black/20 border border-white/5 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Your address</p>
                <p className="text-xs font-mono">{address}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setRequestDialogIssuer(null); setRequestSent(false) }}>Cancel</Button>
                {requestSent ? (
                  <Button className="flex-1" variant="outline" disabled>
                    <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                    Request Sent
                  </Button>
                ) : (
                  <Button className="flex-1" disabled={requestPending} onClick={async () => {
                    if (!address) return
                    setRequestPending(true)
                    try {
                      await requestCredential(requestDialogIssuer.address, requestDialogIssuer.type)
                      setRequestSent(true)
                    } catch (e) {
                      // user rejected or error — just close
                    } finally {
                      setRequestPending(false)
                    }
                  }}>
                    {requestPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirm in wallet...</> : <><Send className="w-4 h-4 mr-2" />Send Request</>}
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
