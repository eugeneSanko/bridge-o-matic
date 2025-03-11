
import React from 'react';
import QRCodeReact from 'qrcode.react';

interface QrCodeProps {
  value: string;
}

export const QrCode = ({ value }: QrCodeProps) => {
  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <QRCodeReact 
        value={value} 
        size={200}
        level="H"
        includeMargin={true}
      />
    </div>
  );
};
