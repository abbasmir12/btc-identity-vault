import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Camera, X } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: { hash: string; owner: string }) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText)
            if (data.hash && data.owner) {
              scanner.stop()
              onScan(data)
            }
          } catch (e) {
            console.error('Invalid QR data')
          }
        },
        () => {}
      )

      setScanning(true)
    } catch (err) {
      console.error('Camera access denied', err)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      setScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Scan Credential QR Code</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div id="qr-reader" className="rounded-lg overflow-hidden" />

      {!scanning ? (
        <Button onClick={startScanning} className="w-full">
          <Camera className="w-4 h-4 mr-2" />
          Start Camera
        </Button>
      ) : (
        <Button variant="outline" onClick={stopScanning} className="w-full">
          Stop Scanning
        </Button>
      )}
    </div>
  )
}
