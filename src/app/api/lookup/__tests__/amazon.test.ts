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
  let amazonHtmlContent: string;

  beforeAll(() => {
    amazonHtmlContent = fs.readFileSync(
      path.resolve(process.cwd(), "typical/amazon.html"),
      "utf-8",
    );
  });

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
    const request = createMockRequest("1800818025"); // Use a dummy barcode
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.amazon.items).toHaveLength(2); // Found 2 items in the mock HTML

    const amazonItem = json.amazon.items[0];
    expect(amazonItem.format).toBe("Hardcover");
    expect(amazonItem.quality).toBe("New");
  });
});
