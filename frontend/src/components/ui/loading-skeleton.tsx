import { motion } from "framer-motion"

export function CredentialSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-white/10 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
        <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse" />
      </div>
    </motion.div>
  )
}

export function StatSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-white/10 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-12 w-12 bg-white/10 rounded-full animate-pulse" />
      </div>
    </motion.div>
  )
}
