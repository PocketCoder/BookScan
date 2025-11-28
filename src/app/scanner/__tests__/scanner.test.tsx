// src/app/scanner/__tests__/scanner.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import ScannerPage from '@/app/scanner/page';
import '@testing-library/jest-dom';

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: (key: string) => {
            if (key === 'barcode') return '1234567890123';
            return null;
        },
    }),
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock the fetch API
global.fetch = jest.fn();

const mockBookDetails = {
    title: 'Test Book',
    authors: ['Author One'],
    coverImage: 'https://example.com/cover.jpg',
    format: 'Hardcover',
};

const mockResponse = {
    bookDetails: mockBookDetails,
    ebay: { items: [] },
    abeBooks: { items: [] },
    amazon: { items: [] },
    summary: {
        minItem: null,
        averageItem: null,
        highestItem: null,
    },
};

describe('Scanner Page', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockReset();
    });

    it('fetches and displays book details for a barcode', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        render(<ScannerPage />);

        // Should show loading state initially
        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        // Wait for the book title to appear
        await waitFor(() => {
            expect(screen.getByText('Test Book')).toBeInTheDocument();
        });

        // Verify authors are displayed
        expect(screen.getByText(/author one/i)).toBeInTheDocument();
    });

    it('displays error message when API fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Failed to fetch book details' }),
        });

        render(<ScannerPage />);

        await waitFor(() => {
            expect(screen.getByText(/failed to fetch book details/i)).toBeInTheDocument();
        });
    });
});
