import React from 'react';
import { render, screen } from '@testing-library/react';
import { BarcodeScanner } from '../barcode-scanner';
import { mockUseZxing, mockUseTorch, createMockScanResult } from '@/test-utils/mocks';

// Mock react-zxing
jest.mock('react-zxing', () => ({
    useZxing: jest.fn(),
    Result: {},
    BarcodeFormat: {
        EAN_13: 13,
        UPC_A: 12,
    },
    DecodeHintType: {
        POSSIBLE_FORMATS: 'POSSIBLE_FORMATS',
    },
}));

// Mock useTorch hook
jest.mock('@/hooks/use-torch', () => ({
    useTorch: jest.fn(),
}));

describe('BarcodeScanner', () => {
    const mockOnResult = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        (require('react-zxing').useZxing as jest.Mock).mockImplementation(mockUseZxing);
        (require('@/hooks/use-torch').useTorch as jest.Mock).mockImplementation(mockUseTorch);
    });

    it('should render video element', () => {
        render(<BarcodeScanner onResult={mockOnResult} />);

        const video = screen.getByLabelText('Barcode scanner video feed');
        expect(video).toBeInTheDocument();
        expect(video.tagName).toBe('VIDEO');
    });

    it('should call onResult when barcode is scanned', () => {
        const mockResult = createMockScanResult('9780545010221');
        const mockOnDecodeResult = jest.fn();

        (require('react-zxing').useZxing as jest.Mock).mockImplementation((options) => {
            // Simulate a scan by calling the callback
            if (options.onDecodeResult) {
                setTimeout(() => options.onDecodeResult(mockResult), 0);
            }
            return {
                ref: { current: null },
                torch: {
                    on: jest.fn(),
                    off: jest.fn(),
                    isAvailable: true,
                },
            };
        });

        render(<BarcodeScanner onResult={mockOnResult} />);

        // Wait for the async callback
        setTimeout(() => {
            expect(mockOnResult).toHaveBeenCalledWith(mockResult);
        }, 10);
    });

    it('should show flash button when torch is available', () => {
        (require('@/hooks/use-torch').useTorch as jest.Mock).mockReturnValue({
            isTorchOn: false,
            toggleFlash: jest.fn(),
            isAvailable: true,
            setVideoRef: jest.fn(),
        });

        render(<BarcodeScanner onResult={mockOnResult} />);

        expect(screen.getByText('Flash On')).toBeInTheDocument();
    });

    it('should not show flash button when torch is not available', () => {
        (require('@/hooks/use-torch').useTorch as jest.Mock).mockReturnValue({
            isTorchOn: false,
            toggleFlash: jest.fn(),
            isAvailable: false,
            setVideoRef: jest.fn(),
        });

        render(<BarcodeScanner onResult={mockOnResult} />);

        expect(screen.queryByText('Flash On')).not.toBeInTheDocument();
        expect(screen.queryByText('Flash Off')).not.toBeInTheDocument();
    });

    it('should toggle flash button text when torch is on', () => {
        (require('@/hooks/use-torch').useTorch as jest.Mock).mockReturnValue({
            isTorchOn: true,
            toggleFlash: jest.fn(),
            isAvailable: true,
            setVideoRef: jest.fn(),
        });

        render(<BarcodeScanner onResult={mockOnResult} />);

        expect(screen.getByText('Flash Off')).toBeInTheDocument();
        expect(screen.queryByText('Flash On')).not.toBeInTheDocument();
    });

    it('should pass paused prop to useZxing', () => {
        const useZxingSpy = jest.fn().mockReturnValue({
            ref: { current: null },
            torch: { on: jest.fn(), off: jest.fn(), isAvailable: true },
        });
        (require('react-zxing').useZxing as jest.Mock).mockImplementation(useZxingSpy);

        render(<BarcodeScanner onResult={mockOnResult} paused={true} />);

        expect(useZxingSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                paused: true,
            })
        );
    });

    it('should default paused to false when not provided', () => {
        const useZxingSpy = jest.fn().mockReturnValue({
            ref: { current: null },
            torch: { on: jest.fn(), off: jest.fn(), isAvailable: true },
        });
        (require('react-zxing').useZxing as jest.Mock).mockImplementation(useZxingSpy);

        render(<BarcodeScanner onResult={mockOnResult} />);

        expect(useZxingSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                paused: false,
            })
        );
    });
});
