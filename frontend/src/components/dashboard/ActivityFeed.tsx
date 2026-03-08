import { motion } from "framer-motion"
import { ArrowDownCircle, Share2, CheckCircle, Ban } from "lucide-react"
import type { ActivityItem } from "@/types"

const typeConfig: Record<string, { icon: typeof ArrowDownCircle; color: string; bgColor: string }> = {
  issued: { icon: ArrowDownCircle, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  shared: { icon: Share2, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  verified: { icon: CheckCircle, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  revoked: { icon: Ban, color: "text-red-400", bgColor: "bg-red-500/10" },
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity, i) => {
        const config = typeConfig[activity.type]
        const Icon = config.icon

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors"
          >
            <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 30) return `${diffDays}d ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}
