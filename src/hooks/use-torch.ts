import { useEffect, useState, useRef } from "react";

interface TorchControl {
    on: () => Promise<void>;
    off: () => Promise<void>;
    isAvailable: boolean | null;
}

interface UseTorchReturn {
    isTorchOn: boolean;
    toggleFlash: () => void;
    isAvailable: boolean;
    setVideoRef: (ref: HTMLVideoElement | null) => void;
}

/**
 * Custom hook to manage torch/flashlight state for barcode scanning
 * Uses direct media stream API to avoid camera restart issues
 * @param torch - The torch control object from useZxing (used for availability check)
 * @returns Object containing torch state and toggle function
 */
export function useTorch(torch: TorchControl): UseTorchReturn {
    const [isTorchOn, setIsTorchOn] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const setVideoRef = (ref: HTMLVideoElement | null) => {
        videoRef.current = ref;
    };

    const toggleFlash = async () => {
        if (!torch.isAvailable || !videoRef.current) return;

        try {
            const stream = videoRef.current.srcObject as MediaStream;
            if (!stream) return;

            const track = stream.getVideoTracks()[0];
            if (!track) return;

            const capabilities = track.getCapabilities() as any;

            // Check if torch is supported
            if (!capabilities.torch) {
                console.warn("Torch not supported on this device");
                return;
            }

            // Toggle torch using applyConstraints
            await track.applyConstraints({
                advanced: [{ torch: !isTorchOn } as any],
            });

            setIsTorchOn(!isTorchOn);
        } catch (error) {
            console.error("Error toggling torch:", error);
            // Fallback to react-zxing torch if direct control fails
            try {
                if (isTorchOn) {
                    await torch.off();
                    setIsTorchOn(false);
                } else {
                    await torch.on();
                    setIsTorchOn(true);
                }
            } catch (fallbackError) {
                console.error("Fallback torch toggle also failed:", fallbackError);
            }
        }
    };

    useEffect(() => {
        // Clean up torch when component unmounts
        return () => {
            if (torch.isAvailable && isTorchOn && videoRef.current) {
                const stream = videoRef.current.srcObject as MediaStream;
                if (stream) {
                    const track = stream.getVideoTracks()[0];
                    if (track) {
                        track.applyConstraints({
                            advanced: [{ torch: false } as any],
                        }).catch(() => {
                            // If direct control fails, try react-zxing
                            torch.off().catch(console.error);
                        });
                    }
                }
            }
        };
    }, [torch, isTorchOn]);

    return {
        isTorchOn,
        toggleFlash,
        isAvailable: torch.isAvailable ?? false,
        setVideoRef,
    };
}
