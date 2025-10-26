import { GET } from '../route';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock cheerio
jest.mock('cheerio', () => {
  const actualCheerio = jest.requireActual('cheerio');
  return {
    load: jest.fn((html) => actualCheerio.load(html)),
  };
});

// Helper to create a mock request object
const createMockRequest = (barcode: string | null) => {
  const url = barcode ? `http://localhost:3000/api/lookup?barcode=${barcode}` : 'http://localhost:3000/api/lookup';
  return {
    url,
    json: async () => ({}),
  } as unknown as Request;
};

describe('API Route - GET /api/lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if barcode is missing', async () => {
    const request = createMockRequest(null);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: 'Barcode is required' });
  });

  it('should return 500 if an unexpected error occurs', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.startsWith('https://www.googleapis.com/books')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ data: '' });
    });

    const request = createMockRequest('1234567890');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty('error', 'Failed to fetch data for the provided barcode.');
    expect(json).toHaveProperty('details', 'Network error');
  });

  describe('parsePrice', () => {
    // Directly import and test parsePrice if it's exported, or extract it for testing
    // For now, assuming it's an internal helper, we'll test its behavior via the main flow or extract it.
    // If it's not exported, we can't directly test it without refactoring.
    // Let's assume for now it's part of the file we are testing and will be implicitly covered
    // or we'll need to refactor to export it.
  });

  describe('fetchBookDetails', () => {
    it('should fetch book details successfully', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith('https://www.googleapis.com/books')) {
          return Promise.resolve({
            data: {
              items: [
                {
                  volumeInfo: {
                    title: 'Test Book',
                    authors: ['Author One'],
                    imageLinks: { thumbnail: 'http://example.com/cover.jpg' },
                    printType: 'BOOK',
                  },
                },
              ],
            },
          });
        }
        return Promise.resolve({ data: '' });
      });

      const request = createMockRequest('1234567890');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.bookDetails).toEqual({
        title: 'Test Book',
        authors: ['Author One'],
        coverImage: 'http://example.com/cover.jpg',
        format: 'BOOK',
      });
    });

    it('should return empty book details if no items are found', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith('https://www.googleapis.com/books')) {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.resolve({ data: '' });
      });

      const request = createMockRequest('1234567890');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.bookDetails).toEqual({});
    });

    it('should handle errors during book details fetch', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith('https://www.googleapis.com/books')) {
          return Promise.reject(new Error('Google Books API error'));
        }
        return Promise.resolve({ data: '' });
      });

      const request = createMockRequest('1234567890');
      const response = await GET(request);

      expect(response.status).toBe(500);
      // Optionally, check if console.error was called
      // jest.spyOn(console, 'error').mockImplementation(() => {});
      // expect(console.error).toHaveBeenCalledWith('Error fetching book details from Google Books API:', expect.any(Error));
    });
  });

  // Add tests for scrapeEbay, scrapeAmazon, scrapeAbeBooks, scrapeWorldOfBooks
  // These will require more elaborate mocking of cheerio and HTML content.
  // For now, I'll add a placeholder for one of them.

  describe('scrapeEbay', () => {
    it('should scrape eBay items successfully', async () => {
      const mockEbayHtml = `
        <div class="s-item">
          <a class="s-item__link" href="https://www.ebay.co.uk/itm/123">
            <div class="s-item__title">Test Book - Used</div>
            <div class="s-item__price">£10.00</div>
            <span class="ux-textspans">Used</span>
            <span>Format: <span class="ux-textspans">Paperback</span></span>
          </a>
        </div>
        <div class="s-item">
          <a class="s-item__link" href="https://www.ebay.co.uk/itm/456">
            <div class="s-item__title">Another Book - New</div>
            <div class="s-item__price">£20.50</div>
            <span class="ux-textspans">New</span>
            <span>Format: <span class="ux-textspans">Hardcover</span></span>
          </a>
        </div>
        <div class="s-item">
          <a class="s-item__link" href="https://www.ebay.co.uk/itm/789">
            <div class="s-item__title">Bundle of Books</div>
            <div class="s-item__price">£50.00</div>
          </a>
        </div>
      `;

      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith('https://www.googleapis.com/books')) {
          return Promise.resolve({ data: { items: [] } });
        } else if (url.startsWith('https://www.ebay.co.uk')) {
          return Promise.resolve({ data: mockEbayHtml });
        }
        return Promise.resolve({ data: '' });
      });

      const request = createMockRequest('1234567890');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.ebay.items).toHaveLength(2);
      expect(json.ebay.items[0]).toEqual({
        price: 10.00,
        link: 'https://www.ebay.co.uk/itm/123',
        quality: 'Used',
        format: 'Paperback',
      });
      expect(json.ebay.items[1]).toEqual({
        price: 20.50,
        link: 'https://www.ebay.co.uk/itm/456',
        quality: 'New',
        format: 'Hardcover',
      });
    });

    it('should handle errors during eBay scraping', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith('https://www.googleapis.com/books')) {
          return Promise.resolve({ data: { items: [] } });
        } else if (url.startsWith('https://www.ebay.co.uk')) {
          return Promise.reject(new Error('eBay scrape error'));
        }
        return Promise.resolve({ data: '' });
      });

      const request = createMockRequest('1234567890');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.ebay.items).toEqual([]);
      // Optionally, check if console.error was called
      // jest.spyOn(console, 'error').mockImplementation(() => {});
      // expect(console.error).toHaveBeenCalledWith('Error scraping eBay:', expect.any(Error));
    });
  });

  // Test the overall aggregation and sorting
  it('should aggregate, sort, and summarize items correctly', async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.startsWith('https://www.googleapis.com/books')) {
        return Promise.resolve({ data: { items: [] } });
      } else if (url.startsWith('https://www.ebay.co.uk')) {
        return Promise.resolve({ data: `
          <div class="s-item"><a class="s-item__link" href="/ebay1"><div class="s-item__title">Ebay Book 1</div><div class="s-item__price">£15.00</div></div></a></div>
          <div class="s-item"><a class="s-item__link" href="/ebay2"><div class="s-item__title">Ebay Book 2</div><div class="s-item__price">£5.00</div></div></a></div>
        `});
      } else if (url.startsWith('https://www.abebooks.com')) {
        return Promise.resolve({ data: `
          <div id="srp-results">
            <div class="result-item">
              <div class="result-title">AbeBooks Book 1</div>
              <div class="item-price">£12.00</div>
              <div class="result-detail"><a href="/abe1">link</a></div>
            </div>
            <div class="result-item">
              <div class="result-title">AbeBooks Book 2</div>
              <div class="item-price">£25.00</div>
              <div class="result-detail"><a href="/abe2">link</a></div>
            </div>
          </div>
        `});
      } else if (url.startsWith('https://www.wob.com')) {
        return Promise.resolve({ data: `
          <div class="product-card"><a href="/wob1"><div class="price">£8.00</div></div></a></div>
          <div class="product-card"><a href="/wob2"><div class="price">£18.00</div></div></a></div>
        `});
      } else if (url.startsWith('https://www.amazon.co.uk')) {
        return Promise.resolve({ data: `
          <div class="s-result-item" data-asin="1"><a class="a-link-normal a-text-normal" href="/amazon1"><span class="a-price-whole">10</span><span class="a-price-fraction">.00</span></div></a></div>
          <div class="s-result-item" data-asin="2"><a class="a-link-normal a-text-normal" href="/amazon2"><span class="a-price-whole">3</span><span class="a-price-fraction">.50</span></div></a></div>
        `});
      }
      return Promise.resolve({ data: '' });
    });

    const request = createMockRequest('1234567890');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ebay.items).toHaveLength(2);
    expect(json.abeBooks.items).toHaveLength(2);
    expect(json.worldOfBooks.items).toHaveLength(2);
    expect(json.amazon.items).toHaveLength(2);

    // Check sorting
    expect(json.ebay.items[0].price).toBe(5.00);
    expect(json.ebay.items[1].price).toBe(15.00);

    expect(json.abeBooks.items[0].price).toBe(12.00);
    expect(json.abeBooks.items[1].price).toBe(25.00);

    expect(json.worldOfBooks.items[0].price).toBe(8.00);
    expect(json.worldOfBooks.items[1].price).toBe(18.00);

    expect(json.amazon.items[0].price).toBe(3.50);
    expect(json.amazon.items[1].price).toBe(10.00);

    // Check summary
    expect(json.summary.minItem.price).toBe(3.50);
    expect(json.summary.maxItem.price).toBe(25.00);
    expect(json.summary.highestItem.price).toBe(25.00);
  });
});
