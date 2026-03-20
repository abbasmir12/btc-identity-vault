import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, FileCheck, Share2, Bell, Search, Plus, 
  LayoutGrid, List, SlidersHorizontal, UserPlus,
  CheckCircle, XCircle, Building2, ArrowRight, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CredentialCard from "@/components/dashboard/CredentialCard"
import CredentialDetail from "@/components/dashboard/CredentialDetail"
import ActivityFeed from "@/components/dashboard/ActivityFeed"
import ShareDialog from "@/components/dashboard/ShareDialog"
import RegisterIdentityDialog from "@/components/dashboard/RegisterIdentityDialog"
import { CredentialSkeleton } from "@/components/ui/loading-skeleton"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import { useWallet } from "@/contexts/WalletContext"
import * as stacks from "@/lib/stacks"
import type { Credential, CredentialType } from "@/types"

function StatusPill({ status }: { status: string }) {
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  )
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <Bell className="w-3 h-3" /> Pending
    </span>
  )
}

const filterTypes: { value: CredentialType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "education", label: "Education" },
  { value: "employment", label: "Employment" },
  { value: "identity", label: "Identity" },
  { value: "certification", label: "Certification" },
  { value: "healthcare", label: "Healthcare" },
]

export default function DashboardPage() {
  const { user, address } = useWallet()
  const { toasts, removeToast, success } = useToast()
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [shareCredential, setShareCredential] = useState<Credential | null>(null)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<CredentialType | "all">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [useBlockchain] = useState(true)
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"credentials" | "requests">("credentials")
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  // Load credentials from blockchain
  useEffect(() => {
    const loadCredentials = async () => {
      if (!address) {
        // Show empty state if not connected
        setCredentials([])
        setLoading(false)
        return
      }

      if (!useBlockchain) {
        // Use empty data if blockchain disabled
        setCredentials([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        // Get issued credentials from recipient index
        const recipientResult = await stacks.getRecipientCredentials(address)
        const credEntries: any[] = recipientResult?.value ?? []

        const issuedPromises = credEntries.map(async (entry: any) => {
          const issuerAddr = entry.value?.issuer?.value
          const hashHex = entry.value?.['credential-hash']?.value
          if (!issuerAddr || !hashHex) return null
          const hashBytes = Uint8Array.from(hashHex.replace('0x','').match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16)))
          const [credData, issuerData] = await Promise.all([
            stacks.getIssuedCredentialDetail(issuerAddr, hashBytes),
            stacks.getIssuerProfile(issuerAddr),
          ])
          const cred = credData?.value?.value
          if (!cred) return null
          const issuerProfile = issuerData?.value?.value
          const issuerName = issuerProfile?.name?.value ?? issuerAddr.slice(0, 12) + '...'
          const credType = cred['credential-type']?.value ?? 'Credential'
          return {
            id: hashHex.slice(0, 12),
            type: credType.toLowerCase() as any,
            title: `${credType} — ${issuerName}`,
            issuer: issuerName,
            issuerAddress: issuerAddr,
            issuedDate: new Date(parseInt(cred['issued-at']?.value ?? '0') * 1000).toISOString().split('T')[0],
            status: cred['is-revoked']?.value ? 'revoked' : 'active',
            description: `Issued by ${issuerName}`,
            hash: hashHex,
            fields: {
              'Issuer': issuerName,
              'Issuer Address': issuerAddr,
              'Credential Type': credType,
              'Website': issuerProfile?.['metadata-url']?.value ?? '',
              'On-Chain Hash': hashHex,
              'Issued At': new Date(parseInt(cred['issued-at']?.value ?? '0') * 1000).toLocaleDateString(),
            },
            sharedWith: [],
          } as any
        })

        // Also show approved requests as credentials
        const outResult = await stacks.getOutgoingRequests(address)
        const outAddrs: any[] = outResult?.value ?? []
        const approvedPromises = outAddrs.map(async (a: any) => {
          const issuerAddr = a.value
          const [reqData, issuerData] = await Promise.all([
            stacks.getCredentialRequest(address, issuerAddr),
            stacks.getIssuerProfile(issuerAddr),
          ])
          const req = reqData?.value?.value
          if (!req || req.status?.value !== 'approved') return null
          const issuerProfile = issuerData?.value?.value
          const issuerName = issuerProfile?.name?.value ?? issuerAddr.slice(0, 12) + '...'
          const credType = req['credential-type']?.value ?? 'Credential'
          return {
            id: `req-${issuerAddr.slice(0,8)}`,
            type: credType.toLowerCase() as any,
            title: `${credType} — ${issuerName}`,
            issuer: issuerName,
            issuerAddress: issuerAddr,
            issuedDate: new Date().toISOString().split('T')[0],
            status: 'active',
            description: `Issued by ${issuerName}`,
            hash: '',
            fields: {
              'Issuer': issuerName,
              'Issuer Address': issuerAddr,
              'Credential Type': credType,
              'Website': issuerProfile?.['metadata-url']?.value ?? '',
              'Issued At': new Date().toLocaleDateString(),
            },
            sharedWith: [],
          } as any
        })

        const all = (await Promise.all([...issuedPromises, ...approvedPromises])).filter(Boolean) as Credential[]
        // dedupe by issuer
        const seen = new Set()
        setCredentials(all.filter(c => { const k = c.issuerAddress + c.type; return seen.has(k) ? false : seen.add(k) }))
      } catch (error) {
        console.error('Error loading credentials:', error)
        setCredentials([])
      } finally {
        setLoading(false)
      }
    }

    loadCredentials()

    // Load on-chain credential requests
    if (address) {
      loadRequests(address)
    }

  }, [address, useBlockchain])

  const loadRequests = async (addr: string) => {
    const [outResult, inResult] = await Promise.all([
      stacks.getOutgoingRequests(addr),
      stacks.getIncomingRequests(addr),
    ])
    const outAddrs: any[] = outResult?.value ?? []
    const inAddrs: any[] = inResult?.value ?? []
    const [outReqs, inReqs] = await Promise.all([
      Promise.all(outAddrs.map(async (a: any) => {
        const req = await stacks.getCredentialRequest(addr, a.value)
        const data = req?.value?.value  // unwrap optional → tuple
        return data ? { issuerAddress: a.value, ...data } : null
      })),
      Promise.all(inAddrs.map(async (a: any) => {
        const req = await stacks.getCredentialRequest(a.value, addr)
        const data = req?.value?.value  // unwrap optional → tuple
        return data ? { requesterAddress: a.value, ...data } : null
      })),
    ])
    setOutgoingRequests(outReqs.filter(Boolean))
    setIncomingRequests(inReqs.filter(Boolean))
  }

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.issuer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === "all" || cred.type === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, <span className="btc-text-gradient">{user?.btcName || address?.slice(0, 8) + '...'}</span>
          </h1>
          <p className="text-muted-foreground">Manage your verifiable credentials</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Credentials", value: credentials.length, icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Requests Sent", value: outgoingRequests.length, icon: Share2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Approved", value: outgoingRequests.filter((r: any) => r.status?.value === 'approved').length, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Pending Approval", value: incomingRequests.filter((r: any) => r.status?.value === 'pending').length, icon: Bell, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl glass p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 w-fit mb-6">
          {[
            { id: "credentials", label: "Credentials", count: credentials.length },
            { id: "requests", label: "Requests", count: incomingRequests.filter(r => r.status?.value === 'pending').length || outgoingRequests.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab.id === 'requests' ? 'bg-amber-500/20 text-amber-400' : activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Credentials Section */}
          <div className="lg:col-span-2">
          {activeTab === "credentials" ? (<>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search credentials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filterTypes.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFilter === filter.value
                      ? "bg-primary text-black"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Credentials Grid */}
            {loading ? (
              <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-4" : "space-y-4"}>
                {[...Array(4)].map((_, i) => (
                  <CredentialSkeleton key={i} />
                ))}
              </div>
            ) : filteredCredentials.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 rounded-2xl glass"
              >
                <FileCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchQuery || activeFilter !== "all" 
                    ? "Try adjusting your search or filters"
                    : "Get started by registering your identity"}
                </p>
                {!searchQuery && activeFilter === "all" && !user?.btcName && (
                  <Button onClick={() => setShowRegisterDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register Identity
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-4" : "space-y-4"}>
                {filteredCredentials.map((credential, i) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    index={i}
                    onSelect={setSelectedCredential}
                    onShare={setShareCredential}
                    onRevoked={(id) => setCredentials(prev => prev.filter(c => c.id !== id))}
                  />
                ))}
              </div>
            )}
          </>) : (
            /* Requests Panel */
            <div className="space-y-8">
              <div className="flex justify-end">
                <button onClick={() => address && loadRequests(address)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
              {/* Outgoing - My Requests */}
              {outgoingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-400" />
                  Requests I Sent
                </h3>
                  <div className="space-y-3">
                    {outgoingRequests.map((req, i) => {
                      const status = req.status?.value ?? 'pending'
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="rounded-2xl glass p-5 flex items-center gap-4"
                        >
                          <div className="p-3 rounded-xl bg-primary/10 flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-0.5">{req['credential-type']?.value} Credential</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">To: {req.issuerAddress}</p>
                            <p className="text-xs text-muted-foreground mt-1">Block #{req['requested-at']?.value}</p>
                          </div>
                          <StatusPill status={status} />
                        </motion.div>
                      )
                    })}
                  </div>
              </div>
              )}

              {/* Incoming - Received Requests */}
              {incomingRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400" />
                  Received Requests
                  {incomingRequests.filter(r => r.status?.value === 'pending').length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {incomingRequests.filter(r => r.status?.value === 'pending').length} pending
                    </span>
                  )}
                </h3>
                  <div className="space-y-3">
                    {incomingRequests.map((req, i) => {
                      const status = req.status?.value ?? 'pending'
                      const reqKey = req.requesterAddress
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="rounded-2xl glass p-5"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-amber-500/10 flex-shrink-0">
                              <UserPlus className="w-5 h-5 text-amber-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{req['credential-type']?.value} Credential Request</p>
                                <StatusPill status={status} />
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">From: {req.requesterAddress}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Block #{req['requested-at']?.value}</p>
                            </div>
                          </div>
                          {status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" className="flex-1" disabled={processingRequest === reqKey}
                                onClick={async () => {
                                  setProcessingRequest(reqKey)
                                  try {
                                    await stacks.approveRequest(req.requesterAddress)
                                    alert('✅ Approved! Now click "Issue" to issue the credential.')
                                  } catch (e: any) {
                                    console.error('Approve failed:', e?.message)
                                    alert('Approve failed: ' + e?.message)
                                  } finally { setProcessingRequest(null) }
                                }}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {processingRequest === reqKey ? 'Confirm in wallet...' : 'Approve'}
                              </Button>
                              <Button size="sm" variant="secondary" className="flex-1" disabled={processingRequest === reqKey}
                                onClick={async () => {
                                  setProcessingRequest(reqKey)
                                  try {
                                    const hashData = `${req.requesterAddress}:${req['credential-type']?.value}:${Date.now()}`
                                    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashData))
                                    const credHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('')
                                    await stacks.issueCredential(
                                      req.requesterAddress,
                                      credHash,
                                      req['credential-type']?.value ?? 'Education',
                                      Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                                      'https://example.com/credential.json'
                                    )
                                    setTimeout(() => { if (address) loadRequests(address) }, 15000)
                                    setTimeout(() => { if (address) loadRequests(address) }, 30000)
                                  } catch (e: any) {
                                    console.error('Issue failed:', e?.message)
                                    alert('Issue failed: ' + e?.message)
                                  } finally { setProcessingRequest(null) }
                                }}>
                                {processingRequest === reqKey ? 'Confirm in wallet...' : 'Issue'}
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" disabled={processingRequest === reqKey}
                                onClick={async () => {
                                  setProcessingRequest(reqKey)
                                  try {
                                    await stacks.rejectRequest(req.requesterAddress)
                                    setTimeout(() => { if (address) loadRequests(address) }, 15000)
                                    setTimeout(() => { if (address) loadRequests(address) }, 30000)
                                  } finally { setProcessingRequest(null) }
                                }}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
              </div>
              )}

              {outgoingRequests.length === 0 && incomingRequests.length === 0 && (
                <div className="rounded-2xl glass p-8 text-center text-muted-foreground text-sm">
                  No requests yet. Go to <span className="text-primary">Issuers</span> to request a credential.
                </div>
              )}
            </div>
          )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl glass p-5"
            >
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {!user?.btcName && (
                <button 
                  onClick={() => setShowRegisterDialog(true)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <UserPlus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Register Identity</div>
                    <div className="text-xs text-muted-foreground">Register on blockchain</div>
                  </div>
                </button>
                )}
                <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Request Credential</div>
                    <div className="text-xs text-muted-foreground">From a trusted issuer</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Generate Proof</div>
                    <div className="text-xs text-muted-foreground">Create a verifiable proof</div>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl glass p-5"
            >
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <ActivityFeed activities={[]} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedCredential && (
          <CredentialDetail
            credential={selectedCredential}
            onClose={() => setSelectedCredential(null)}
            onShare={(cred) => { setSelectedCredential(null); setShareCredential(cred); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareCredential && (
          <ShareDialog
            credential={shareCredential}
            onClose={() => setShareCredential(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRegisterDialog && (
          <RegisterIdentityDialog
            onClose={() => setShowRegisterDialog(false)}
            onSuccess={() => {
              success("Identity registered successfully!")
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
