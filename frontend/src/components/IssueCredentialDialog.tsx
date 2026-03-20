import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Award, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { issueCredential } from "@/lib/stacks"
import { sanitizeInput, validateStacksAddress, validateCredentialTitle, validateURL } from "@/lib/validation"

interface IssueCredentialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultRecipient?: string
}

type Status = "idle" | "pending" | "success" | "error"

export default function IssueCredentialDialog({ open, onOpenChange, defaultRecipient = "" }: IssueCredentialDialogProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [txId, setTxId] = useState<string>("")
  const [error, setError] = useState<string>("")
  
  const [formData, setFormData] = useState({
    recipient: defaultRecipient,
    credentialType: "Education",
    title: "",
    expiresAt: "",
    metadataUrl: "",
  })

  const credentialTypes = [
    "Education",
    "Employment",
    "Certification",
    "License",
    "Achievement",
  ]

  // Generate SHA-256 hash from credential data
  const generateCredentialHash = async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate recipient address
    const addressValidation = validateStacksAddress(formData.recipient)
    if (!addressValidation.valid) {
      setError(addressValidation.error || "Invalid recipient address")
      return
    }

    // Validate credential title
    const titleValidation = validateCredentialTitle(formData.title)
    if (!titleValidation.valid) {
      setError(titleValidation.error || "Invalid credential title")
      return
    }

    // Validate metadata URL if provided
    if (formData.metadataUrl) {
      const urlValidation = validateURL(formData.metadataUrl)
      if (!urlValidation.valid) {
        setError(urlValidation.error || "Invalid URL")
        return
      }
    }

    setStatus("pending")
    setError("")

    try {
      // Sanitize inputs
      const sanitizedTitle = sanitizeInput(formData.title)
      const sanitizedUrl = formData.metadataUrl ? sanitizeInput(formData.metadataUrl) : ""
      
      // Generate credential hash from title + type + timestamp
      const credentialData = `${sanitizedTitle}:${formData.credentialType}:${Date.now()}`
      const credentialHash = await generateCredentialHash(credentialData)
      
      // Calculate expiry (default 1 year from now in block height)
      const expiresAt = formData.expiresAt 
        ? Math.floor(new Date(formData.expiresAt).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
      
      const response = await issueCredential(
        formData.recipient,
        credentialHash,
        formData.credentialType,
        expiresAt,
        sanitizedUrl || "https://example.com/credential.json"
      )
      
      setTxId(response.txid || "")
      setStatus("success")
    } catch (err: any) {
      setError(err.message || "Failed to issue credential")
      setStatus("error")
    }
  }

  const handleClose = () => {
    if (status !== "pending") {
      setStatus("idle")
      setTxId("")
      setError("")
      setFormData({
        recipient: "",
        credentialType: "Education",
        title: "",
        expiresAt: "",
        metadataUrl: "",
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Issue Credential
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="recipient">Recipient Address</label>
                <Input
                  id="recipient"
                  placeholder="SP2..."
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="title">Credential Title</label>
                <Input
                  id="title"
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={128}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type">Credential Type</label>
                <select
                  id="type"
                  value={formData.credentialType}
                  onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {credentialTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="expires">Expiry Date (Optional)</label>
                <Input
                  id="expires"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for 1 year expiry
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="metadata">Metadata URL (Optional)</label>
                <Input
                  id="metadata"
                  placeholder="https://example.com/credential.json"
                  value={formData.metadataUrl}
                  onChange={(e) => setFormData({ ...formData, metadataUrl: e.target.value })}
                  maxLength={256}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Issue Credential
                </Button>
              </div>
            </motion.form>
          )}

          {status === "pending" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Issuing Credential</h3>
              <p className="text-sm text-muted-foreground">
                Please confirm the transaction in your wallet...
              </p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Credential Issued!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The credential has been successfully issued on-chain.
              </p>
              <div className="p-3 rounded-lg bg-black/20 border border-white/5 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                <p className="text-xs font-mono break-all">{txId}</p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8 text-center"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Issuance Failed</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setStatus("idle")} className="flex-1">
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
