"use client";

import React, { useEffect, useState } from "react";
import { useZxing, Result } from "react-zxing";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface BarcodeScannerProps {
  onResult: (result: Result) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onResult }) => {
  const [isTorchOn, setIsTorchOn] = useState(false);

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.UPC_A,
  ]);

  const { ref, torch } = useZxing({
    hints,
    onDecodeResult: (result) => {
      onResult(result);
    },
  });

  const toggleFlash = () => {
    if (torch.isAvailable) {
      if (isTorchOn) {
        torch.off();
        setIsTorchOn(false);
      } else {
        torch.on();
        setIsTorchOn(true);
      }
    }
  };

  useEffect(() => {
    // Clean up torch when component unmounts
    return () => {
      if (torch.isAvailable && isTorchOn) {
        torch.off();
      }
    };
  }, [torch, isTorchOn]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={ref}
        className="w-full h-full object-cover"
        aria-label="Barcode scanner video feed"
      />
      {torch.isAvailable && (
        <button
          onClick={toggleFlash}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-800 text-white rounded-full shadow-lg"
        >
          {isTorchOn ? "Flash Off" : "Flash On"}
        </button>
      )}
    </div>
  );
};
