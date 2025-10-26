import { GET } from "../route";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock cheerio
jest.mock("cheerio", () => {
  const actualCheerio = jest.requireActual("cheerio");
  return {
    load: jest.fn((html) => actualCheerio.load(html)),
  };
});

// Helper to create a mock request object
const createMockRequest = (barcode: string | null) => {
  const url = barcode
    ? `http://localhost:3000/api/lookup?barcode=${barcode}`
    : "http://localhost:3000/api/lookup";
  return {
    url,
    json: async () => ({}),
  } as unknown as Request;
};

describe("API Route - GET /api/lookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if barcode is missing", async () => {
    const request = createMockRequest(null);
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Barcode is required" });
  });

  it("should return 500 if an unexpected error occurs", async () => {
    mockedAxios.get.mockImplementation((url) => {
      if (url.startsWith("https://www.googleapis.com/books")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ data: "" });
    });

    const request = createMockRequest("1234567890");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toHaveProperty(
      "error",
      "Failed to fetch data for the provided barcode.",
    );
    expect(json).toHaveProperty("details", "Network error");
  });

  describe("parsePrice", () => {
    // Directly import and test parsePrice if it's exported, or extract it for testing
    // For now, assuming it's an internal helper, we'll test its behavior via the main flow or extract it.
    // If it's not exported, we can't directly test it without refactoring.
    // Let's assume for now it's part of the file we are testing and will be implicitly covered
    // or we'll need to refactor to export it.
  });

  describe("fetchBookDetails", () => {
    it("should fetch book details successfully", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith("https://www.googleapis.com/books")) {
          return Promise.resolve({
            data: {
              items: [
                {
                  volumeInfo: {
                    title: "Test Book",
                    authors: ["Author One"],
                    imageLinks: { thumbnail: "http://example.com/cover.jpg" },
                    printType: "BOOK",
                  },
                },
              ],
            },
          });
        }
        return Promise.resolve({ data: "" });
      });

      const request = createMockRequest("1234567890");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.bookDetails).toEqual({
        title: "Test Book",
        authors: ["Author One"],
        coverImage: "http://example.com/cover.jpg",
        format: "BOOK",
      });
    });

    it("should return empty book details if no items are found", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith("https://www.googleapis.com/books")) {
          return Promise.resolve({ data: { items: [] } });
        }
        return Promise.resolve({ data: "" });
      });

      const request = createMockRequest("1234567890");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.bookDetails).toEqual({});
    });

    it("should handle errors during book details fetch", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith("https://www.googleapis.com/books")) {
          return Promise.reject(new Error("Google Books API error"));
        }
        return Promise.resolve({ data: "" });
      });

      const request = createMockRequest("1234567890");
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

  describe("scrapeEbay", () => {
    it("should scrape eBay items successfully", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith("https://www.googleapis.com/books")) {
          return Promise.resolve({ data: { items: [] } });
        } else if (url.startsWith("https://www.ebay.co.uk")) {
          return Promise.resolve({
            data: `
            <div class="s-item">
              <a class="s-item__link" href="https://www.ebay.co.uk/itm/123">
                <div class="s-card__title">Test Book - Used Paperback</div>
                <span class="s-card__price">£10.00</span>
                <span class="s-card__subtitle">Used</span>
              </a>
            </div>
            <div class="s-item">
              <a class="s-item__link" href="https://www.ebay.co.uk/itm/456">
                <div class="s-card__title">Another Book - New Hardcover</div>
                <span class="s-card__price">£20.50</span>
                <span class="s-card__subtitle">New</span>
              </a>
            </div>
            <div class="s-item">
              <a class="s-item__link" href="https://www.ebay.co.uk/itm/789">
                <div class="s-card__title">Bundle of Books</div>
                <span class="s-card__price">£50.00</span>
                <span class="s-card__subtitle">Used</span>
              </a>
            </div>
          `,
          });
        }
        return Promise.resolve({ data: "" });
      });
      const request = createMockRequest("1234567890");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.ebay.items).toHaveLength(2);
      expect(json.ebay.items[0]).toEqual({
        price: 10.0,
        link: "https://www.ebay.co.uk/itm/123",
        quality: "Used",
        format: "Paperback",
      });
      expect(json.ebay.items[1]).toEqual({
        price: 20.5,
        link: "https://www.ebay.co.uk/itm/456",
        quality: "New",
        format: "Hardcover",
      });
    });

    it("should handle errors during eBay scraping", async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.startsWith("https://www.googleapis.com/books")) {
          return Promise.resolve({ data: { items: [] } });
        } else if (url.startsWith("https://www.ebay.co.uk")) {
          return Promise.reject(new Error("eBay scrape error"));
        }
        return Promise.resolve({ data: "" });
      });

      const request = createMockRequest("1234567890");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toEqual({
        error: "Failed to fetch data for the provided barcode.",
        details: "eBay scrape error",
      });
      // Optionally, check if console.error was called
      // jest.spyOn(console, 'error').mockImplementation(() => {});
      // expect(console.error).toHaveBeenCalledWith('Error scraping eBay:', expect.any(Error));
    });
  });

  // Test the overall aggregation and sorting
  it("should aggregate, sort, and summarize items correctly", async () => {
    const request = createMockRequest("1234567890");
    mockedAxios.get.mockImplementation((url) => {
      if (url.startsWith("https://www.googleapis.com/books")) {
        return Promise.resolve({ data: { items: [] } });
      } else if (url.startsWith("https://www.ebay.co.uk")) {
        if (url.includes("/sch/i.html")) {
          return Promise.resolve({
            data: `
            <div class="s-item"><a class="s-item__link" href="https://www.ebay.co.uk/ebay1"><div class="s-item__title">Ebay Book 1</div><div class="s-item__price">£15.00</div></div></a></div>
            <div class="s-item"><a class="s-item__link" href="https://www.ebay.co.uk/ebay2"><div class="s-item__title">Ebay Book 2</div><div class="s-item__price">£5.00</div></div></a></div>
          `,
          });
        } else if (url.includes("https://www.ebay.co.uk/ebay1")) {
          return Promise.resolve({
            data: `
            <div class="x-item-title__mainTitle"><span class="ux-textspans">Ebay Book 1</span></div>
            <div class="x-price-primary"><span class="ux-textspans">£15.00</span></div>
            <div class="x-item-condition-text"><span class="ux-textspans">Used</span></div>
            <div class="ux-layout-section--item-details"><div class="ux-labels-values__labels">Format:</div><div class="ux-labels-values__values">Paperback</div></div>
            <link rel="canonical" href="https://www.ebay.co.uk/ebay1"/>
          `,
          });
        } else if (url.includes("https://www.ebay.co.uk/ebay2")) {
          return Promise.resolve({
            data: `
            <div class="x-item-title__mainTitle"><span class="ux-textspans">Ebay Book 2</span></div>
            <div class="x-price-primary"><span class="ux-textspans">£5.00</span></div>
            <div class="x-item-condition-text"><span class="ux-textspans">New</span></div>
            <div class="ux-layout-section--item-details"><div class="ux-labels-values__labels">Format:</div><div class="ux-labels-values__values">Hardcover</div></div>
            <link rel="canonical" href="https://www.ebay.co.uk/ebay2"/>
          `,
          });
        }
        return Promise.resolve({ data: "" });
      } else if (url.startsWith("https://www.worldofbooks.com")) {
        return Promise.resolve({
          data: `
          <div class="product-card">
            <a class="product-card__title-link" href="/en-gb/book/123">
              <h3 class="product-card__title">WOB Book 1 - Used Paperback</h3>
            </a>
            <div class="product-card__price">£8.00</div>
            <div class="product-card__condition">Used</div>
            <div class="product-card__format">Paperback</div>
          </div>
          <div class="product-card">
            <a class="product-card__title-link" href="/en-gb/book/456">
              <h3 class="product-card__title">WOB Book 2 - New Hardcover</h3>
            </a>
            <div class="product-card__price">£18.00</div>
            <div class="product-card__condition">New</div>
            <div class="product-card__format">Hardcover</div>
          </div>
        `,
        });
      } else if (url.startsWith("https://www.amazon.co.uk")) {
        return Promise.resolve({
          data: `
          <div class="s-result-item" data-asin="1">
            <h2 class="a-size-medium a-text-normal">
              <a class="a-link-normal a-text-normal" href="/amazon1">Amazon Book 1</a>
            </h2>
            <span class="a-price">
              <span class="a-offscreen">£10.00</span>
            </span>
            <div data-cy="secondary-offer-recipe">Used - Very Good</div>
            <div class="a-row a-size-base a-color-base">
              <a class="a-link-normal a-text-normal" href="#">Paperback</a>
            </div>
          </div>
          <div class="s-result-item" data-asin="2">
            <h2 class="a-size-medium a-text-normal">
              <a class="a-link-normal a-text-normal" href="/amazon2">Amazon Book 2</a>
            </h2>
            <span class="a-price">
              <span class="a-offscreen">£3.50</span>
            </span>
            <div data-cy="secondary-offer-recipe">New</div>
            <div class="a-row a-size-base a-color-base">
              <a class="a-link-normal a-text-normal" href="#">Hardcover</a>
            </div>
          </div>
        `,
        });
      } else if (url.startsWith("https://www.abebooks.co.uk")) {
        return Promise.resolve({
          data: `
          <div class="result-item">
            <div class="result-detail">
              <h2><a href="/servlet/BookDetailsPL?bi=12345">AbeBooks Book 1</a></h2>
            </div>
            <div class="result-pricing">
              <span class="x-large">£12.00</span>
            </div>
            <p class="item-description">Used - Very Good</p>
            <div class="m-sm-b"><span>Paperback</span></div>
          </div>
        `,
        });
      }
    });
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ebay.items).toHaveLength(2);
    expect(json.abeBooks.items).toHaveLength(1);
    expect(json.worldOfBooks.items[0]).toEqual({
      price: 8.0,
      link: "https://www.worldofbooks.com/en-gb/book/123",
      quality: "Used",
      format: "Paperback",
    });
    expect(json.worldOfBooks.items[1]).toEqual({
      price: 18.0,
      link: "https://www.worldofbooks.com/en-gb/book/456",
      quality: "New",
      format: "Hardcover",
    });
    expect(json.amazon.items[0]).toEqual({
      price: 3.5,
      link: "https://www.amazon.co.uk/amazon2",
      quality: "New",
      format: "Hardcover",
    });
    expect(json.amazon.items[1]).toEqual({
      price: 10.0,
      link: "https://www.amazon.co.uk/amazon1",
      quality: "Used - Very Good",
      format: "Paperback",
    });

    // Check sorting
    expect(json.ebay.items[0].price).toBe(5.0);
    expect(json.ebay.items[1].price).toBe(15.0);

    expect(json.abeBooks.items[0]).toEqual({
      price: 12.0,
      link: "https://www.abebooks.co.uk/servlet/BookDetailsPL?bi=12345",
      quality: "Used - Very Good",
      format: "Paperback",
    });

    // Check summary
    expect(json.summary.minItem.price).toBe(3.5);
    expect(json.summary.maxItem.price).toBe(18.0);
    expect(json.summary.highestItem.price).toBe(18.0);
  });
});
