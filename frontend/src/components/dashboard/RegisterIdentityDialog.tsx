import { useState } from "react"
import { motion } from "framer-motion"
import { UserPlus, X, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { registerIdentity } from "@/lib/stacks"
import { sanitizeInput, validateBTCName } from "@/lib/validation"

interface RegisterIdentityDialogProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function RegisterIdentityDialog({ onClose, onSuccess }: RegisterIdentityDialogProps) {
  const [btcName, setBtcName] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)

  const handleRegister = async () => {
    // Validate BTC name
    const validation = validateBTCName(btcName)
    if (!validation.valid) {
      setError(validation.error || "Invalid BTC name")
      return
    }

    setIsPending(true)
    setError(null)

    try {
      // Sanitize input before sending to blockchain
      const sanitizedName = sanitizeInput(btcName)
      const result = await registerIdentity(sanitizedName) as { txId: string }
      setTxId(result.txId)
      setIsSuccess(true)
      
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setIsPending(false)
    }
  }

  if (isSuccess) {
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
          <h3 className="text-xl font-semibold mb-2">Identity Registered!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your identity has been registered on the blockchain
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
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Register Identity</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">
              BTC Name
            </label>
            <Input
              placeholder="alice.btc"
              value={btcName}
              onChange={(e) => setBtcName(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Enter your .btc name to register your identity on-chain
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button
            onClick={handleRegister}
            disabled={!btcName.trim() || isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Register Identity
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
