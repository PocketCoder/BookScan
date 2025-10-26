'use client';

import { useZxing, Result } from 'react-zxing';

interface BarcodeScannerProps {
  onResult: (result: Result) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onResult }) => {
  const { ref } = useZxing({
    onDecodeResult: (result) => {
      onResult(result);
    },
  });

  return <video ref={ref} className="w-full h-full object-cover" aria-label="Barcode scanner video feed" />;
};
