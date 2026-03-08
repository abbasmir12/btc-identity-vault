import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Search, CheckCircle, ExternalLink, Building2, Shield, Users, 
  ArrowRight, Filter 
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockIssuers } from "@/data/mock"

export default function IssuersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")

  const types = ["all", "Education", "Employment", "Government", "Certification", "Healthcare"]

  const filteredIssuers = mockIssuers.filter((issuer) => {
    const matchesSearch = issuer.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <Button variant="outline" size="sm" className="w-full group-hover:border-primary/50 group-hover:text-primary transition-colors">
                Request Credential
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          ))}
        </div>

        {filteredIssuers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No issuers found</p>
          </motion.div>
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
          <Button size="lg">
            Apply as Issuer
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
