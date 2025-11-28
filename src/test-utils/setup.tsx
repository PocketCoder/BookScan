import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of @testing-library/react's render for consistent testing
 */
export function renderWithProviders(
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { ...options });
}

/**
 * Mock MediaStream API for barcode scanner tests
 * This simulates camera functionality without requiring actual camera access
 */
export function mockMediaStream() {
    const mockStream = {
        getTracks: jest.fn(() => []),
        getVideoTracks: jest.fn(() => [mockVideoTrack]),
        getAudioTracks: jest.fn(() => []),
        addTrack: jest.fn(),
        removeTrack: jest.fn(),
        active: true,
    } as unknown as MediaStream;

    const mockVideoTrack = {
        kind: 'video',
        enabled: true,
        readyState: 'live',
        getCapabilities: jest.fn(() => ({ torch: true })),
        applyConstraints: jest.fn(() => Promise.resolve()),
        stop: jest.fn(),
    } as unknown as MediaStreamTrack;

    mockStream.getVideoTracks = jest.fn(() => [mockVideoTrack]);

    Object.defineProperty(global.navigator, 'mediaDevices', {
        writable: true,
        value: {
            getUserMedia: jest.fn(() => Promise.resolve(mockStream)),
            enumerateDevices: jest.fn(() => Promise.resolve([])),
        },
    });

    return { mockStream, mockVideoTrack };
}

/**
 * Create a mock video element for testing
 */
export function createMockVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    Object.defineProperty(video, 'srcObject', {
        writable: true,
        value: null,
    });
    Object.defineProperty(video, 'play', {
        writable: true,
        value: jest.fn(() => Promise.resolve()),
    });
    Object.defineProperty(video, 'pause', {
        writable: true,
        value: jest.fn(),
    });
    return video;
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
