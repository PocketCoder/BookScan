import { scrapeEbay, ebayApi } from '../route';
import axios from 'axios';

// Mock the entire ebay-api module
jest.mock('ebay-api', () => {
  const mockSearch = jest.fn();
  const mockEbayApiConstructor = jest.fn(() => ({
    buy: {
      browse: {
        search: mockSearch,
      },
    },
  }));

  // Add static properties like MarketplaceId to the mocked constructor
  (mockEbayApiConstructor as any).MarketplaceId = {
    EBAY_GB: 'EBAY_GB', // Mock the specific value used
  };

  return {
    __esModule: true,
    default: mockEbayApiConstructor,
    ebayApi: { // This is the named export from route.ts, which will be the instance created by the mocked constructor
      buy: {
        browse: {
          search: mockSearch,
        },
      },
    },
  };
});

// Mock axios for fetchBookDetails
jest.mock('axios');

describe('scrapeEbay', () => {
  const mockBarcode = '1234567890123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure ebayApi.buy.browse.search is a mock function
    (ebayApi.buy.browse.search as jest.Mock).mockClear();
    (axios.get as jest.Mock).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  it('should return an empty array if no items are found', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [] },
    });
    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValueOnce({
      itemSummaries: [],
    });

    const result = await scrapeEbay(mockBarcode);
    expect(result).toEqual([]);
  });

  it('should throw an error if ebayApi.buy.browse.search throws an error', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [] },
    });
    (ebayApi.buy.browse.search as jest.Mock).mockRejectedValueOnce(new Error('eBay API error'));

    const result = await scrapeEbay(mockBarcode);
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith('Error scraping eBay:', expect.any(Error));
  });

  it('should correctly parse and return item data from eBay', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        items: [
          {
            volumeInfo: {
              title: 'Test Book Title',
              authors: ['Author One'],
              imageLinks: { thumbnail: 'http://example.com/cover.jpg' },
              printType: 'BOOK',
            },
          },
        ],
      },
    });

    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValueOnce({
      itemSummaries: [
        {
          title: 'Test Book Paperback',
          price: { value: '10.50' },
          itemWebUrl: 'http://ebay.com/item1',
          condition: 'USED_GOOD',
        },
        {
          title: 'Test Book Hardcover',
          price: { value: '20.00' },
          itemWebUrl: 'http://ebay.com/item2',
          condition: 'NEW',
        },
        {
          title: 'Test Book - A bundle of 3 books', // Should be filtered out
          price: { value: '30.00' },
          itemWebUrl: 'http://ebay.com/item3',
          condition: 'USED_ACCEPTABLE',
        },
        {
          title: 'Another Book',
          price: { value: '0.00' }, // Should be filtered out
          itemWebUrl: 'http://ebay.com/item4',
          condition: 'USED_GOOD',
        },
        {
          title: 'Yet Another Book',
          price: { value: '15.75' },
          itemWebUrl: '', // Should be filtered out
          condition: 'USED_GOOD',
        },
      ],
    });

    const result = await scrapeEbay(mockBarcode);

    expect(ebayApi.buy.browse.search).toHaveBeenCalledWith({
      q: 'Test Book Title',
      limit: '10',
      filter: 'itemLocationCountry:GB',
    });

    expect(result).toEqual([
      {
        price: 10.50,
        link: 'http://ebay.com/item1',
        quality: 'USED_GOOD',
        format: 'Paperback',
      },
      {
        price: 20.00,
        link: 'http://ebay.com/item2',
        quality: 'NEW',
        format: 'Hardcover',
      },
    ]);
  });

  it('should use barcode as query if book details title is not available', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [] }, // No book details found
    });

    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValueOnce({
      itemSummaries: [
        {
          title: 'Book by Barcode',
          price: { value: '12.34' },
          itemWebUrl: 'http://ebay.com/barcode-book',
          condition: 'USED_VERY_GOOD',
        },
      ],
    });

    await scrapeEbay(mockBarcode);

    expect(ebayApi.buy.browse.search).toHaveBeenCalledWith({
      q: mockBarcode,
      limit: '10',
      filter: 'itemLocationCountry:GB',
    });
  });

  it('should correctly identify Paperback format', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [] },
    });
    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValueOnce({
      itemSummaries: [
        {
          title: 'A Great Book (Paperback)',
          price: { value: '5.00' },
          itemWebUrl: 'http://ebay.com/paperback',
          condition: 'USED_GOOD',
        },
      ],
    });

    const result = await scrapeEbay(mockBarcode);
    expect(result[0].format).toBe('Paperback');
  });

  it('should correctly identify Hardcover format', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [] },
    });
    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValueOnce({
      itemSummaries: [
        {
          title: 'A Classic Novel (Hardcover)',
          price: { value: '15.00' },
          itemWebUrl: 'http://ebay.com/hardcover',
          condition: 'NEW',
        },
      ],
    });

    const result = await scrapeEbay(mockBarcode);
    expect(result[0].format).toBe('Hardcover');
  });

  it('should handle items with no format specified in title', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: { items: [] },
    });
    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValueOnce({
      itemSummaries: [
        {
          title: 'A Generic Book',
          price: { value: '7.50' },
          itemWebUrl: 'http://ebay.com/generic',
          condition: 'USED',
        },
      ],
    });

    const result = await scrapeEbay(mockBarcode);
    expect(result[0].format).toBeUndefined();
  });
});
