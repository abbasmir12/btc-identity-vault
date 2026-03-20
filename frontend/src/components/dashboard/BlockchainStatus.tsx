import { useWallet } from "@/contexts/WalletContext"
import { Badge } from "@/components/ui/badge"

export default function BlockchainStatus() {
  const { isConnected, address } = useWallet()

  if (!isConnected || !address) {
    return (
      <Badge variant="outline" className="gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
        Not Connected
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-2">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
      {address.substring(0, 6)}...{address.substring(address.length - 4)}
    </Badge>
  )
}
