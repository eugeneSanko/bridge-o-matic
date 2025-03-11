
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCodeProps {
  value: string;
}

export const QrCode = ({ value }: QrCodeProps) => {
  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCodeSVG 
        value={value} 
        size={200}
        level="H"
        includeMargin={true}
      />
    </div>
  );
};
