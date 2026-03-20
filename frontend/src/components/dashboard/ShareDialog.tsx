import { useState } from "react"
import { motion } from "framer-motion"
import { Share2, X, CheckCircle, QrCode, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Credential } from "@/types"
import { grantAccess } from "@/lib/stacks"
import CredentialQRCode from "@/components/CredentialQRCode"
import { useWallet } from "@/contexts/WalletContext"

interface ShareDialogProps {
  credential: Credential
  onClose: () => void
}

export default function ShareDialog({ credential, onClose }: ShareDialogProps) {
  const { address } = useWallet()
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [verifierAddress, setVerifierAddress] = useState("")
  const [isShared, setIsShared] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    )
  }

  const handleShare = async () => {
    setIsPending(true)
    setError(null)
    
    try {
      // Call blockchain transaction
      const result = await grantAccess(
        credential.hash,
        verifierAddress,
        0, // 0 = never expires
        selectedFields.join(',')
      ) as { txid: string }
      
      setTxId(result.txid)
      setIsShared(true)
      
      setTimeout(() => {
        onClose()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setIsPending(false)
    }
  }

  if (isShared) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative z-50 rounded-2xl border border-emerald-500/30 bg-card p-12 text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-semibold mb-2">Credential Shared!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {selectedFields.length} fields shared successfully
          </p>
          {txId && (
            <div className="p-3 rounded-lg bg-black/20 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Transaction ID:</p>
              <p className="text-xs font-mono break-all">{txId}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-50 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Share Credential</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Credential being shared */}
          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
            <p className="text-sm font-medium">{credential.title}</p>
            <p className="text-xs text-muted-foreground">by {credential.issuer}</p>
          </div>

          {/* Select fields */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select fields to share</label>
            <div className="space-y-2">
              {Object.keys(credential.fields).map((field) => (
                <label
                  key={field}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFields.includes(field)
                      ? "border-primary/50 bg-primary/5"
                      : "border-white/5 bg-black/20 hover:border-white/10"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedFields.includes(field)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}>
                    {selectedFields.includes(field) && (
                      <CheckCircle className="w-3 h-3 text-black" />
                    )}
                  </div>
                  <span className="text-sm">{field}</span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedFields.includes(field)}
                    onChange={() => toggleField(field)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Verifier address */}
          <div>
            <label className="text-sm font-medium mb-2 block">Verifier STX Address</label>
            <Input
              placeholder="SP1A2B3C4D..."
              value={verifierAddress}
              onChange={(e) => setVerifierAddress(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleShare}
              disabled={selectedFields.length === 0 || !verifierAddress || isPending}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share {selectedFields.length} Field{selectedFields.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQR(!showQR)}
              disabled={isPending}
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR
            </Button>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
            >
              {error}
            </motion.div>
          )}

          {showQR && address && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-secondary"
            >
              <CredentialQRCode
                credentialHash={credential.hash}
                ownerAddress={address}
                title={credential.title}
              />
              <p className="text-xs text-muted-foreground text-center">
                Scan to verify credential with {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} shared
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
