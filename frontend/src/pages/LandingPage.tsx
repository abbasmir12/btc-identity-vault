import { motion } from "framer-motion"
import { Shield, Fingerprint, Eye, Lock, ArrowRight, Bitcoin, Zap, Globe, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/WalletContext"

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
}

const features = [
  {
    icon: Shield,
    title: "Self-Sovereign",
    description: "You own your identity. No company, no government, no third party controls your data. Secured by Bitcoin.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Eye,
    title: "Selective Disclosure",
    description: "Share only what's needed. Prove you're over 18 without revealing your birthday. Zero-knowledge proofs on Bitcoin.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Fingerprint,
    title: "Verifiable Credentials",
    description: "Cryptographic proof that credentials are authentic. Instantly verifiable by anyone, tamper-proof forever.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Lock,
    title: "Encrypted Storage",
    description: "Your data is encrypted with your keys and stored off-chain. Only you decide who gets access and when.",
    color: "from-emerald-500 to-teal-500",
  },
]

const stats = [
  { value: "256-bit", label: "Encryption" },
  { value: "100%", label: "User-Owned" },
  { value: "< 2s", label: "Verification" },
  { value: "Bitcoin", label: "Secured" },
]

const steps = [
  { step: "01", title: "Connect Wallet", description: "Link your Stacks wallet and claim your .btc identity" },
  { step: "02", title: "Receive Credentials", description: "Get verified credentials from trusted issuers" },
  { step: "03", title: "Share Selectively", description: "Choose exactly what to share with verifiers" },
  { step: "04", title: "Revoke Anytime", description: "Maintain full control — revoke access instantly" },
]

export default function LandingPage() {
  const { connectWallet, isConnecting } = useWallet()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Bitcoin className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by Bitcoin & Stacks</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Your Identity.
            <br />
            <span className="btc-text-gradient">Your Rules.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            The first self-sovereign identity vault on Bitcoin. Own your credentials, 
            share selectively, verify instantly — all secured by the most trusted blockchain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="xl"
              onClick={connectWallet}
              disabled={isConnecting}
              className="group"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Launch Vault
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
            <Button size="xl" variant="outline">
              Learn More
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold btc-text-gradient">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-primary rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Core Features</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-4">
              Identity, <span className="btc-text-gradient">Reimagined</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mx-auto">
              Built on Bitcoin's unmatched security. Powered by Stacks smart contracts. 
              Designed for the decentralized future.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="group relative rounded-2xl glass glass-hover p-8 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">How It Works</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-4">
              Four Steps to <span className="btc-text-gradient">Sovereignty</span>
            </motion.h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                custom={i}
                className="relative rounded-2xl glass p-6 text-center"
              >
                <div className="text-4xl font-bold btc-text-gradient mb-3">{step.step}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 btc-gradient opacity-10" />
            <div className="absolute inset-0 glass" />
            <div className="relative p-12 sm:p-16 text-center">
              <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Own Your Identity?
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-muted-foreground max-w-lg mx-auto mb-8">
                Join the future of decentralized identity. Secure, private, and 
                truly yours — backed by the Bitcoin blockchain.
              </motion.p>
              <motion.div variants={fadeUp} custom={2}>
                <Button size="xl" onClick={connectWallet} disabled={isConnecting} className="group">
                  <span className="flex items-center gap-2">
                    Connect Wallet & Start
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </motion.div>
              <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free to use</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> No data collection</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Open source</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-semibold">BTC Identity Vault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built on Stacks. Secured by Bitcoin. Open Source.
          </p>
        </div>
      </footer>
    </div>
  )
}
