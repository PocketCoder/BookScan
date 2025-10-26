/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import ScannerPage from '../page';
import {
  useSearchParams,
} from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    // ... add any other router methods you use
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useServerInsertedHTML: jest.fn(),
}));

// Mock BarcodeScanner component
jest.mock('@/components/barcode-scanner', () => ({
  BarcodeScanner: jest.fn(({ onResult }) => {
    // Provide a way to simulate a scan in tests
    global.simulateBarcodeScan = (text: string) => {
      onResult({
        getText: () => text,
        getBarcodeFormat: () => 'EAN_13',
        getTimestamp: () => Date.now(),
      });
    };
    return <div data-testid="barcode-scanner" />;
  }),
}));

const mockApiData = {
  bookDetails: {
    title: 'Test Book',
    authors: ['Author 1', 'Author 2'],
    coverImage: 'http://example.com/cover.jpg',
    format: 'Paperback',
  },
  ebay: {
    items: [
      { price: 10.00, link: 'http://ebay.com/1', quality: 'Used', format: 'Paperback' },
      { price: 15.00, link: 'http://ebay.com/2', quality: 'New', format: 'Hardcover' },
    ],
  },
  abeBooks: {
    items: [
      { price: 8.00, link: 'http://abebooks.com/1', quality: 'Good', format: 'Paperback' },
    ],
  },
  worldOfBooks: {
    items: [
      { price: 5.00, link: 'http://wob.com/1', quality: 'Acceptable', format: 'Mass Market Paperback' },
    ],
  },
  amazon: {
    items: [
      { price: 7.50, link: 'http://amazon.com/1', quality: 'New', format: 'Paperback' },
      { price: 12.50, link: 'http://amazon.com/2', quality: 'Used', format: 'Hardcover' },
    ],
  },
  summary: {
    minItem: { price: 5.00, link: 'http://wob.com/1', quality: 'Acceptable', format: 'Mass Market Paperback' },
    maxItem: { price: 15.00, link: 'http://ebay.com/2', quality: 'New', format: 'Hardcover' },
    highestItem: { price: 15.00, link: 'http://ebay.com/2', quality: 'New', format: 'Hardcover' },
  },
};

describe('ScannerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockApiData),
      } as Response)
    );
  });

  it('should render correctly initially', () => {
    render(<ScannerPage />);
    expect(screen.getByText('Book Price Scanner')).toBeInTheDocument();
    expect(screen.getByText('Scan a barcode or enter it manually to find book prices.')).toBeInTheDocument();
    expect(screen.getByTestId('barcode-scanner')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('should show loading state when fetching data', async () => {
    // Defer the fetch response to keep it in loading state initially
    global.fetch = jest.fn(() => new Promise(() => {})); 

    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('barcode=123'));
    render(<ScannerPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error message if API call fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'API Error Message' }),
      } as Response)
    );

    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('barcode=123'));
    render(<ScannerPage />);

    await waitFor(() => {
      expect(screen.getByText('Error: API Error Message')).toBeInTheDocument();
    });
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should display book details and scraper results after successful scan', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('barcode=1234567890'));
    render(<ScannerPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    expect(screen.getByText('by Author 1, Author 2')).toBeInTheDocument();
    expect(screen.getByText('Format: Paperback')).toBeInTheDocument();
    expect(screen.getByAltText('Cover of Test Book')).toBeInTheDocument();

    expect(screen.getByText('Minimum Price:')).toBeInTheDocument();
    expect(screen.getByText('Maximum Price:')).toBeInTheDocument();

    expect(screen.getByText('eBay')).toBeInTheDocument();
    expect(screen.getByText('AbeBooks')).toBeInTheDocument();
    expect(screen.getByText('World of Books')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();

    // Check eBay items
    const ebayCard = screen.getByText('eBay').closest('[data-slot="card"]');
    expect(within(ebayCard).getByText('£10.00')).toBeInTheDocument();
    expect(within(ebayCard).getByText('Used')).toBeInTheDocument();
    expect(within(ebayCard).getByText('Paperback')).toBeInTheDocument();

    // Check AbeBooks items
    const abeBooksCard = screen.getByText('AbeBooks').closest('[data-slot="card"]');
    expect(within(abeBooksCard).getByText('£8.00')).toBeInTheDocument();
    expect(within(abeBooksCard).getByText('Good')).toBeInTheDocument();
  });

  // Test initial barcode from search params
  it('should fetch data for initial barcode from search params', async () => {

    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('barcode=initial'));
    render(<ScannerPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith('/api/lookup?barcode=initial');
  });
});
