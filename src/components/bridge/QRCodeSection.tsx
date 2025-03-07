
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface QRCodeSectionProps {
  depositAddress?: string;
  depositAmount?: string;
  fromCurrency?: string;
}

export const QRCodeSection = ({ 
  depositAddress = "", 
  depositAmount = "",
  fromCurrency = ""
}: QRCodeSectionProps) => {
  const [qrType, setQrType] = useState<'address' | 'with-amount'>('address');
  const [qrCodeSrc, setQrCodeSrc] = useState<string>('');
  
  useEffect(() => {
    if (!depositAddress) return;
    
    // Generate QR code
    let qrData = depositAddress;
    
    if (qrType === 'with-amount' && depositAmount) {
      // For certain currencies, we use URI schemes
      if (fromCurrency === 'btc') {
        qrData = `bitcoin:${depositAddress}?amount=${depositAmount}`;
      } else if (fromCurrency === 'eth') {
        qrData = `ethereum:${depositAddress}?value=${depositAmount}`;
      } else {
        qrData = `${depositAddress}?amount=${depositAmount}`;
      }
    }
    
    // Use QR code API to generate code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200&margin=10`;
    setQrCodeSrc(qrUrl);
  }, [depositAddress, depositAmount, fromCurrency, qrType]);

  const hasAddress = depositAddress && depositAddress !== "Generating deposit address...";

  return (
    <div className="col-span-3 glass-card p-6 rounded-xl">
      <div className="text-sm text-gray-400 mb-4">Scan QR code</div>
      {hasAddress ? (
        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          <img 
            src={qrCodeSrc} 
            alt="QR Code" 
            className="w-32 h-32" 
          />
          <div className="text-xs text-center mt-2 text-black">
            {qrType === 'address' ? 'Address only' : 'With amount'}
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg inline-block mb-4 opacity-50">
          <QrCode className="w-32 h-32 text-black" />
          <div className="text-xs text-center mt-2 text-black">
            Address not yet available
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button 
          variant={qrType === 'address' ? "secondary" : "ghost"} 
          size="sm" 
          className="flex-1"
          onClick={() => setQrType('address')}
          disabled={!hasAddress}
        >
          Address
        </Button>
        <Button 
          variant={qrType === 'with-amount' ? "secondary" : "ghost"} 
          size="sm" 
          className="flex-1"
          onClick={() => setQrType('with-amount')}
          disabled={!hasAddress}
        >
          With amount
        </Button>
      </div>
    </div>
  );
};
