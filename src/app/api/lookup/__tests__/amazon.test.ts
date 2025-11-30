import { GET, ebayApi } from "../route";
import axios from "axios";
import { load } from "cheerio";
import * as fs from "fs";
import * as path from "path";

// Mock next/server
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}));

// Mock ebay-api
jest.mock('ebay-api', () => {
  const mockSearch = jest.fn();
  const mockEbayApiConstructor = jest.fn(() => ({
    buy: {
      browse: {
        search: mockSearch,
      },
    },
  }));
  (mockEbayApiConstructor as any).MarketplaceId = {
    EBAY_GB: 'EBAY_GB',
  };
  return {
    __esModule: true,
    default: mockEbayApiConstructor,
    ebayApi: {
      buy: {
        browse: {
          search: mockSearch,
        },
      },
    },
  };
});

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

describe("Amazon Scraper", () => {
  const amazonHtmlContent = `
    <html><body>
    <div class="s-result-item" data-asin="1">
      <h2 class="a-size-medium a-text-normal">
        <a class="a-link-normal a-text-normal" href="/book1">Test Book 1</a>
      </h2>
      <div data-cy="price-recipe">
        <div class="a-row a-spacing-mini a-size-base a-color-base">
          <a href="/book1">Hardcover</a>
        </div>
        <div class="a-row a-size-base a-color-base">
          <span class="a-price">
            <span class="a-offscreen">£10.00</span>
          </span>
        </div>
      </div>
      <div data-cy="secondary-offer-recipe">New</div>
    </div>
    <div class="s-result-item" data-asin="2">
      <h2 class="a-size-medium a-text-normal">
        <a class="a-link-normal a-text-normal" href="/book2">Test Book 2</a>
      </h2>
      <div data-cy="price-recipe">
        <div class="a-row a-spacing-mini a-size-base a-color-base">
          <a href="/book2">Paperback</a>
        </div>
        <div class="a-row a-size-base a-color-base">
          <span class="a-price">
            <span class="a-offscreen">£8.50</span>
          </span>
        </div>
      </div>
      <div data-cy="secondary-offer-recipe">Used - Good</div>
    </div>
    </body></html>
  `;

  beforeEach(() => {
    jest.clearAllMocks();
    (ebayApi.buy.browse.search as jest.Mock).mockResolvedValue({ itemSummaries: [] });
    mockedAxios.get.mockImplementation((url) => {
      if (url.startsWith("https://www.googleapis.com/books")) {
        return Promise.resolve({ data: { items: [] } });
      } else if (url.startsWith("https://www.amazon.co.uk")) {
        return Promise.resolve({ data: amazonHtmlContent });
      }
      return Promise.resolve({ data: "" });
    });
  });

  it("should correctly scrape format and condition from Amazon", async () => {
    const request = createMockRequest("1800818025");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.amazon.items).toHaveLength(2);

    expect(json.amazon.items[0]).toEqual({
      price: 8.5,
      link: "https://www.amazon.co.uk/book2",
      format: "Paperback",
      quality: "Used - Good",
    });

    expect(json.amazon.items[1]).toEqual({
      price: 10.0,
      link: "https://www.amazon.co.uk/book1",
      format: "Hardcover",
      quality: "New",
    });
  });
});
