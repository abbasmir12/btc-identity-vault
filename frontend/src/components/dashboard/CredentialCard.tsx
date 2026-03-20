import { motion } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { 
  GraduationCap, Briefcase, CreditCard, Award, Heart, DollarSign, 
  Share2, MoreVertical, ExternalLink, Shield, Clock, RotateCcw
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Credential, CredentialType } from "@/types"
import * as stacks from "@/lib/stacks"

const typeConfig: Record<CredentialType, { icon: typeof GraduationCap; color: string; bgColor: string; borderColor: string }> = {
  education: { icon: GraduationCap, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  employment: { icon: Briefcase, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  identity: { icon: CreditCard, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  certification: { icon: Award, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  healthcare: { icon: Heart, color: "text-rose-400", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/20" },
  financial: { icon: DollarSign, color: "text-teal-400", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20" },
}

const statusVariant: Record<string, "success" | "destructive" | "warning" | "info"> = {
  active: "success",
  revoked: "destructive",
  expired: "warning",
  pending: "info",
}

interface CredentialCardProps {
  credential: Credential
  index: number
  onSelect: (credential: Credential) => void
  onShare: (credential: Credential) => void
  onRevoked?: (id: string) => void
}

export default function CredentialCard({ credential, index, onSelect, onShare, onRevoked }: CredentialCardProps) {
  const config = typeConfig[credential.type]
  const Icon = config.icon
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleRevoke = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    if (!credential.hash) { alert('No on-chain hash — this credential was approved but not issued via issue-credential.'); return }
    if (!confirm('Revoke this credential on-chain? This cannot be undone.')) return
    try {
      await stacks.revokeCredential(credential.hash.replace('0x',''), 'Revoked by issuer')
      alert('Revocation tx broadcast. Refresh in ~30s.')
      onRevoked?.(credential.id)
    } catch (e: any) {
      alert('Revoke failed: ' + e?.message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative rounded-2xl border ${config.borderColor} ${config.bgColor} backdrop-blur-sm p-6 cursor-pointer transition-all duration-300 hover:shadow-lg`}
      onClick={() => onSelect(credential)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[credential.status]}>
            {credential.status}
          </Badge>
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-border bg-card shadow-xl py-1">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onSelect(credential) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors">
                  <ExternalLink className="w-4 h-4" /> View Details
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onShare(credential) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                {credential.hash && (
                  <a href={`https://explorer.hiro.so/txid/${credential.hash}?chain=testnet`} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-white/5 transition-colors">
                    <Shield className="w-4 h-4" /> View on Explorer
                  </a>
                )}
                <div className="border-t border-border my-1" />
                <button onClick={handleRevoke}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <RotateCcw className="w-4 h-4" /> Revoke
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Title & Issuer */}
      <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
        {credential.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        by {credential.issuer}
      </p>

      {/* Quick info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {new Date(credential.issuedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
        {credential.sharedWith.length > 0 && (
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Shared with {credential.sharedWith.length}
          </span>
        )}
      </div>

      {/* Hash preview */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/20 border border-white/5">
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-mono text-muted-foreground truncate">
          {credential.hash || 'Approved on-chain'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onShare(credential); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>
    </motion.div>
  )
}
