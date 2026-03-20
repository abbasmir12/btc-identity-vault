import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { registerIssuer } from "@/lib/stacks"
import { sanitizeInput, validateOrganizationName, validateURL } from "@/lib/validation"

interface RegisterIssuerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Status = "idle" | "pending" | "success" | "error"

export default function RegisterIssuerDialog({ open, onOpenChange }: RegisterIssuerDialogProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [txId, setTxId] = useState<string>("")
  const [error, setError] = useState<string>("")
  
  const [formData, setFormData] = useState({
    name: "",
    type: "Education",
    metadataUrl: "",
  })

  const issuerTypes = [
    "Education",
    "Employment",
    "Government",
    "Certification",
    "Healthcare",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate organization name
    const nameValidation = validateOrganizationName(formData.name)
    if (!nameValidation.valid) {
      setError(nameValidation.error || "Invalid organization name")
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
      // Sanitize inputs before sending to blockchain
      const sanitizedName = sanitizeInput(formData.name)
      const sanitizedUrl = formData.metadataUrl ? sanitizeInput(formData.metadataUrl) : ""
      
      const response = await registerIssuer(
        sanitizedName,
        formData.type,
        sanitizedUrl || "https://example.com/metadata.json"
      )
      
      setTxId(response.txid || "")
      setStatus("success")
    } catch (err: any) {
      setError(err.message || "Failed to register issuer")
      setStatus("error")
    }
  }

  const handleClose = () => {
    if (status !== "pending") {
      setStatus("idle")
      setTxId("")
      setError("")
      setFormData({ name: "", type: "Education", metadataUrl: "" })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Register as Issuer
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
                <label htmlFor="name" className="text-sm font-medium">Organization Name</label>
                <Input
                  id="name"
                  placeholder="e.g., Stanford University"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={128}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Issuer Type</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {issuerTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="metadata" className="text-sm font-medium">Metadata URL (Optional)</label>
                <Input
                  id="metadata"
                  placeholder="https://example.com/metadata.json"
                  value={formData.metadataUrl}
                  onChange={(e) => setFormData({ ...formData, metadataUrl: e.target.value })}
                  maxLength={256}
                />
                <p className="text-xs text-muted-foreground">
                  Link to organization details and verification documents
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Register
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
              <h3 className="text-lg font-semibold mb-2">Processing Registration</h3>
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
              <h3 className="text-lg font-semibold mb-2">Registration Submitted!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your issuer registration is pending verification by administrators.
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
              <h3 className="text-lg font-semibold mb-2">Registration Failed</h3>
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
