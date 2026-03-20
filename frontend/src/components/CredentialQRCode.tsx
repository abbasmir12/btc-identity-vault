import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface CredentialQRCodeProps {
  credentialHash: string
  ownerAddress: string
  title: string
}

export default function CredentialQRCode({ credentialHash, ownerAddress, title }: CredentialQRCodeProps) {
  const qrData = JSON.stringify({
    hash: credentialHash,
    owner: ownerAddress,
    timestamp: Date.now(),
  })

  const downloadQR = () => {
    const svg = document.getElementById('credential-qr')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      
      const downloadLink = document.createElement('a')
      downloadLink.download = `${title.replace(/\s+/g, '-')}-qr.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-white rounded-xl">
        <QRCodeSVG
          id="credential-qr"
          value={qrData}
          size={200}
          level="H"
          includeMargin
        />
      </div>
      <Button variant="outline" size="sm" onClick={downloadQR}>
        <Download className="w-4 h-4 mr-2" />
        Download QR
      </Button>
    </div>
  )
}
