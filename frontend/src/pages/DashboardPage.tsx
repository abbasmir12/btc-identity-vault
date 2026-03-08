import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, FileCheck, Share2, Bell, Search, Plus, 
  LayoutGrid, List, SlidersHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import CredentialCard from "@/components/dashboard/CredentialCard"
import CredentialDetail from "@/components/dashboard/CredentialDetail"
import ActivityFeed from "@/components/dashboard/ActivityFeed"
import ShareDialog from "@/components/dashboard/ShareDialog"
import { useWallet } from "@/contexts/WalletContext"
import { mockCredentials, mockActivity, mockVerificationRequests } from "@/data/mock"
import type { Credential, CredentialType } from "@/types"

const filterTypes: { value: CredentialType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "education", label: "Education" },
  { value: "employment", label: "Employment" },
  { value: "identity", label: "Identity" },
  { value: "certification", label: "Certification" },
  { value: "healthcare", label: "Healthcare" },
]

export default function DashboardPage() {
  const { user } = useWallet()
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null)
  const [shareCredential, setShareCredential] = useState<Credential | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<CredentialType | "all">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredCredentials = mockCredentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.issuer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === "all" || cred.type === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, <span className="btc-text-gradient">{user?.btcName}</span>
          </h1>
          <p className="text-muted-foreground">Manage your verifiable credentials</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Credentials", value: mockCredentials.length, icon: FileCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
            { label: "Active Shares", value: mockCredentials.reduce((acc, c) => acc + c.sharedWith.length, 0), icon: Share2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Verifications", value: user?.verificationCount ?? 0, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "Pending Requests", value: mockVerificationRequests.filter((r) => r.status === "pending").length, icon: Bell, color: "text-amber-400", bg: "bg-amber-500/10" },
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

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Credentials Section */}
          <div className="lg:col-span-2">
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
            <div className={viewMode === "grid" ? "grid sm:grid-cols-2 gap-4" : "space-y-4"}>
              {filteredCredentials.map((credential, i) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  index={i}
                  onSelect={setSelectedCredential}
                  onShare={setShareCredential}
                />
              ))}
            </div>

            {filteredCredentials.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">No credentials found</p>
                <p className="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Requests */}
            {mockVerificationRequests.filter((r) => r.status === "pending").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl glass p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    Pending Requests
                  </h3>
                  <Badge variant="warning">{mockVerificationRequests.filter((r) => r.status === "pending").length}</Badge>
                </div>
                <div className="space-y-3">
                  {mockVerificationRequests
                    .filter((r) => r.status === "pending")
                    .map((req) => (
                      <div key={req.id} className="p-3 rounded-xl bg-black/20 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{req.verifierName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(req.requestDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Requesting: {req.requestedFields.join(", ")}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs">Approve</Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">Decline</Button>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl glass p-5"
            >
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
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
              <ActivityFeed activities={mockActivity} />
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
    </div>
  )
}
