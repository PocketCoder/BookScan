'use client';

import React, { useEffect } from 'react';
import { useZxing, Result } from 'react-zxing';

interface BarcodeScannerProps {
  onResult: (result: Result) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onResult }) => {
  const { ref, torch } = useZxing({
    onDecodeResult: (result) => {
      onResult(result);
    },
  });

  const toggleFlash = () => {
    if (torch.isAvailable) {
      if (torch.isOn) {
        torch.off();
      } else {
        torch.on();
      }
    }
  };

  useEffect(() => {
    // Clean up torch when component unmounts
    return () => {
      if (torch.isAvailable && torch.isOn) {
        torch.off();
      }
    };
  }, [torch]);

  return (
    <div className="relative w-full h-full">
      <video ref={ref} className="w-full h-full object-cover" aria-label="Barcode scanner video feed" />
      {torch.isAvailable && (
        <button
          onClick={toggleFlash}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg"
        >
          {torch.isOn ? 'Flash Off' : 'Flash On'}
        </button>
      )}
    </div>
  );
};
