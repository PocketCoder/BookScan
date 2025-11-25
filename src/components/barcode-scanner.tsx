"use client";

import React, { useCallback } from "react";
import { useZxing, Result } from "react-zxing";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useTorch } from "@/hooks/use-torch";

interface BarcodeScannerProps {
  onResult: (result: Result) => void;
  paused?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onResult,
  paused = false,
}) => {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.UPC_A,
  ]);

  const { ref, torch } = useZxing({
    hints,
    paused,
    onDecodeResult: (result) => {
      onResult(result);
    },
  });

  const { isTorchOn, toggleFlash, isAvailable, setVideoRef } = useTorch(torch);

  // Combine refs to set both the zxing ref and our video ref
  const combinedRef = useCallback(
    (element: HTMLVideoElement | null) => {
      ref.current = element;
      setVideoRef(element);
    },
    [ref, setVideoRef]
  );

  return (
    <div className="relative w-full h-full">
      <video
        ref={combinedRef}
        className="w-full h-full object-cover"
        aria-label="Barcode scanner video feed"
      />
      {isAvailable && (
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
