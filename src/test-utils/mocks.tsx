import { Result } from 'react-zxing';

/**
 * Mock implementations for external dependencies
 */

// Mock useZxing hook from react-zxing
export const mockUseZxing = jest.fn(() => ({
    ref: { current: null },
    torch: {
        on: jest.fn(() => Promise.resolve()),
        off: jest.fn(() => Promise.resolve()),
        isAvailable: true,
    },
}));

// Mock useTorch hook
export const mockUseTorch = jest.fn(() => ({
    isTorchOn: false,
    toggleFlash: jest.fn(),
    isAvailable: true,
    setVideoRef: jest.fn(),
}));

// Mock Next.js router
export const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
    },
};

// Mock Next.js useRouter hook
export const mockUseRouter = jest.fn(() => mockRouter);

// Mock Next.js useSearchParams hook
export const mockUseSearchParams = jest.fn(() => ({
    get: jest.fn((key: string) => null),
}));

// Mock barcode scan result
export function createMockScanResult(barcode: string): Result {
    return {
        text: barcode,
        rawBytes: new Uint8Array(),
        numBits: barcode.length * 8,
        resultPoints: [],
        format: 13, // BarcodeFormat.EAN_13
        timestamp: Date.now(),
        resultMetadata: new Map(),
        getText: () => barcode,
        getBarcodeFormat: () => 13, // EAN_13
        getNumBits: () => barcode.length * 8,
        getRawBytes: () => new Uint8Array(),
        getResultPoints: () => [],
        getTimestamp: () => Date.now(),
        getResultMetadata: () => new Map(),
        putMetadata: () => {},
        addResultPoints: () => {},
    } as unknown as Result;
}

// Mock Next.js Image component
export const MockNextImage = ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
};
