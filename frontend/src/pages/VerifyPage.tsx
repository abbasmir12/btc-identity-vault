import { useState, lazy, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Shield, CheckCircle, XCircle, Clock, 
  QrCode, ArrowRight, Loader2, ExternalLink, Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getCredentialStatus } from "@/lib/stacks"

// Lazy load QR scanner (heavy library)
const QRScanner = lazy(() => import("@/components/QRScanner"))

type VerificationResult = {
  status: "verified" | "invalid" | "expired" | "revoked"
  credential: {
    title: string
    issuer: string
    issuedDate: string
    expiryDate?: string
    hash: string
    fields: Record<string, string>
  }
} | null

export default function VerifyPage() {
  const [hashInput, setHashInput] = useState("")
  const [ownerInput, setOwnerInput] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const handleVerify = async (hash?: string, owner?: string) => {
    const credentialHash = hash || hashInput
    const ownerAddress = owner || ownerInput
    
    if (!credentialHash) return

    setIsVerifying(true)
    setHasSearched(true)

    try {
      const status = await getCredentialStatus(credentialHash, ownerAddress)
      const cred = status?.value?.value
      if (cred) {
        setResult({
          status: cred['is-revoked']?.value ? "revoked" : "verified",
          credential: {
            title: cred['credential-type']?.value || "Credential",
            issuer: ownerAddress,
            issuedDate: new Date(parseInt(cred['issued-at']?.value ?? '0') * 1000).toLocaleDateString(),
            hash: credentialHash,
            fields: {
              'Credential Type': cred['credential-type']?.value ?? '',
              'Recipient': cred.recipient?.value ?? '',
              'Issuer Address': ownerAddress,
            },
          },
        })
      } else {
        setResult({
          status: "invalid",
          credential: { title: "Not Found", issuer: "", issuedDate: "", hash: credentialHash, fields: {} },
        })
      }
    } catch (err) {
      setResult({
        status: "invalid",
        credential: {
          title: "Verification Failed",
          issuer: "Unknown",
          issuedDate: "",
          hash: credentialHash,
          fields: {},
        },
      })
    }

    setIsVerifying(false)
  }

  const handleQRScan = (data: { hash: string; owner: string }) => {
    setShowScanner(false)
    setHashInput(data.hash)
    handleVerify(data.hash, data.owner)
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Verify <span className="btc-text-gradient">Credentials</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Verify the authenticity of any credential by entering its on-chain hash 
            or scanning the verification QR code.
          </p>
        </motion.div>

        {/* Verification Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl glass p-6 sm:p-8 mb-8"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter credential hash (e.g., 0x7f83b1657ff1fc53b...)"
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="lg"
                  onClick={() => handleVerify()}
                  disabled={!hashInput || isVerifying}
                  className="min-w-32"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowScanner(!showScanner)}>
                  <QrCode className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Input
              placeholder="Issuer address (e.g., ST1FW79...)"
              value={ownerInput}
              onChange={(e) => setOwnerInput(e.target.value)}
              className="h-10 text-sm"
            />
          </div>

          {/* QR Scanner */}
          {showScanner && (
            <div className="mt-4 p-4 rounded-lg glass">
              <Suspense fallback={
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Loading scanner...</p>
                </div>
              }>
                <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
              </Suspense>
            </div>
          )}
        </motion.div>

        {/* Verification Result */}
        <AnimatePresence mode="wait">
          {isVerifying && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">Verifying on-chain...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Checking Stacks blockchain</p>
            </motion.div>
          )}

          {!isVerifying && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Status Banner */}
              <div className={`rounded-2xl p-6 border ${
                result.status === "verified"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : result.status === "expired"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}>
                <div className="flex items-center gap-4">
                  {result.status === "verified" ? (
                    <div className="p-3 rounded-full bg-emerald-500/10">
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                  ) : result.status === "expired" ? (
                    <div className="p-3 rounded-full bg-amber-500/10">
                      <Clock className="w-8 h-8 text-amber-500" />
                    </div>
                  ) : (
                    <div className="p-3 rounded-full bg-red-500/10">
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">
                      {result.status === "verified" && "Credential Verified"}
                      {result.status === "expired" && "Credential Expired"}
                      {result.status === "invalid" && "Credential Not Found"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {result.status === "verified" && "This credential is authentic and currently active on the Bitcoin blockchain."}
                      {result.status === "expired" && "This credential was valid but has expired."}
                      {result.status === "invalid" && "No matching credential found on-chain. The hash may be incorrect."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credential Details */}
              {result.status === "verified" && (
                <div className="rounded-2xl glass p-6 space-y-4">
                  <h3 className="font-semibold text-lg">{result.credential.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                    <Badge variant="secondary">Issued by {result.credential.issuer}</Badge>
                    <Badge variant="secondary">
                      {new Date(result.credential.issuedDate).toLocaleDateString()}
                    </Badge>
                  </div>

                  {Object.keys(result.credential.fields).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Shared Fields
                      </h4>
                      {Object.entries(result.credential.fields).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                          <span className="text-sm text-muted-foreground">{key}</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-black/20 border border-white/5">
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground truncate">
                      {result.credential.hash}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!isVerifying && !result && hasSearched && (
            <motion.div
              key="no-result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <XCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Enter a valid credential hash to verify</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How Verification Works */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-center mb-8">
            How <span className="btc-text-gradient">Verification</span> Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Enter Hash",
                description: "Paste the credential hash or scan the QR code provided by the credential holder.",
              },
              {
                step: "02",
                title: "On-Chain Check",
                description: "We verify the hash against the Stacks blockchain to confirm authenticity and validity.",
              },
              {
                step: "03",
                title: "View Results",
                description: "See the verified credential details and the shared fields approved by the holder.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl glass p-6 text-center"
              >
                <div className="text-3xl font-bold btc-text-gradient mb-3">{item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Want to integrate verification into your application?
          </p>
          <Button variant="outline" size="lg">
            View API Documentation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
