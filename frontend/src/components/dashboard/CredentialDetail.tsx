import { motion } from "framer-motion"
import { 
  GraduationCap, Briefcase, CreditCard, Award, Heart, DollarSign,
  X, Share2, Shield, Copy, ExternalLink, Clock, Ban, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Credential, CredentialType } from "@/types"

const typeConfig: Record<CredentialType, { icon: typeof GraduationCap; color: string; bgColor: string }> = {
  education: { icon: GraduationCap, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  employment: { icon: Briefcase, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  identity: { icon: CreditCard, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  certification: { icon: Award, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  healthcare: { icon: Heart, color: "text-rose-400", bgColor: "bg-rose-500/10" },
  financial: { icon: DollarSign, color: "text-teal-400", bgColor: "bg-teal-500/10" },
}

interface CredentialDetailProps {
  credential: Credential
  onClose: () => void
  onShare: (credential: Credential) => void
}

export default function CredentialDetail({ credential, onClose, onShare }: CredentialDetailProps) {
  const config = typeConfig[credential.type]
  const Icon = config.icon

  const copyHash = () => {
    navigator.clipboard.writeText(credential.hash)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{credential.title}</h2>
              <p className="text-sm text-muted-foreground">by {credential.issuer}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Dates */}
          <div className="flex flex-wrap gap-3">
            <Badge variant={credential.status === "active" ? "success" : "warning"}>
              <CheckCircle className="w-3 h-3 mr-1" />
              {credential.status}
            </Badge>
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              Issued {new Date(credential.issuedDate).toLocaleDateString()}
            </Badge>
            {credential.expiryDate && (
              <Badge variant="secondary">
                Expires {new Date(credential.expiryDate).toLocaleDateString()}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground">{credential.description}</p>
          </div>

          {/* Fields */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Credential Fields
            </h3>
            <div className="space-y-2">
              {Object.entries(credential.fields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* On-chain Hash */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              On-Chain Hash
            </h3>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/5">
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                {credential.hash}
              </span>
              <button onClick={copyHash} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Shared With */}
          {credential.sharedWith.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Shared Access ({credential.sharedWith.length})
              </h3>
              <div className="space-y-2">
                {credential.sharedWith.map((access) => (
                  <div key={access.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                    <div>
                      <div className="text-sm font-medium">{access.verifierName}</div>
                      <div className="text-xs text-muted-foreground">
                        {access.fieldsShared.join(", ")} &middot; {new Date(access.sharedDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                      <Ban className="w-3 h-3" />
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => onShare(credential)} className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Credential
            </Button>
            <Button variant="outline" className="flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Generate Proof
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
