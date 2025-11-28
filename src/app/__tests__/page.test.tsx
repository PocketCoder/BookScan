// src/app/__tests__/page.test.tsx
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import '@testing-library/jest-dom';

/**
 * Mock Next.js router for navigation after barcode scan.
 */
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

/**
 * Mock the BarcodeScanner component to avoid media device errors in JSDOM.
 * It renders a simple video element with the expected aria-label.
 */
jest.mock('@/components/barcode-scanner', () => ({
    BarcodeScanner: (props: any) => (
        <video aria-label="Barcode scanner video feed" />
    ),
}));

describe('Home page', () => {
    it('renders the main title and description', () => {
        render(<Home />);
        expect(
            screen.getByRole('heading', { name: /book price scanner/i })
        ).toBeInTheDocument();
        // Use the full description text as it appears in the component
        expect(
            screen.getByText(
                /scan a barcode or enter it manually to find book prices\./i
            )
        ).toBeInTheDocument();
    });

    it('contains the barcode scanner component', () => {
        render(<Home />);
        // The mocked BarcodeScanner component renders a video element
        const video = screen.getByLabelText(/barcode scanner video feed/i);
        expect(video).toBeInTheDocument();
    });
});
