import { renderHook, act } from '@testing-library/react';
import { useTorch } from '../use-torch';
import { mockMediaStream, createMockVideoElement } from '@/test-utils/setup';

describe('useTorch', () => {
    let mockTorchControl: any;
    let mockVideo: HTMLVideoElement;

    beforeEach(() => {
        mockTorchControl = {
            on: jest.fn(() => Promise.resolve()),
            off: jest.fn(() => Promise.resolve()),
            isAvailable: true,
        };

        mockVideo = createMockVideoElement();
        const { mockStream } = mockMediaStream();
        mockVideo.srcObject = mockStream;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with torch off', () => {
        const { result } = renderHook(() => useTorch(mockTorchControl));

        expect(result.current.isTorchOn).toBe(false);
        expect(result.current.isAvailable).toBe(true);
    });

    it('should provide setVideoRef function', () => {
        const { result } = renderHook(() => useTorch(mockTorchControl));

        expect(typeof result.current.setVideoRef).toBe('function');
    });

    it('should toggle torch on when available', async () => {
        const { result } = renderHook(() => useTorch(mockTorchControl));

        // Set video ref
        act(() => {
            result.current.setVideoRef(mockVideo);
        });

        // Toggle torch on
        await act(async () => {
            await result.current.toggleFlash();
        });

        // State should be toggled
        expect(result.current.isTorchOn).toBe(true);
    });

    it('should not toggle torch when not available', async () => {
        mockTorchControl.isAvailable = false;
        const { result } = renderHook(() => useTorch(mockTorchControl));

        act(() => {
            result.current.setVideoRef(mockVideo);
        });

        await act(async () => {
            await result.current.toggleFlash();
        });

        // State should remain false
        expect(result.current.isTorchOn).toBe(false);
    });

    it('should not toggle torch when video ref is not set', async () => {
        const { result } = renderHook(() => useTorch(mockTorchControl));

        await act(async () => {
            await result.current.toggleFlash();
        });

        expect(result.current.isTorchOn).toBe(false);
    });

    it('should return correct availability status', () => {
        const { result } = renderHook(() => useTorch(mockTorchControl));
        expect(result.current.isAvailable).toBe(true);

        mockTorchControl.isAvailable = null;
        const { result: result2 } = renderHook(() => useTorch(mockTorchControl));
        expect(result2.current.isAvailable).toBe(false);
    });
});
