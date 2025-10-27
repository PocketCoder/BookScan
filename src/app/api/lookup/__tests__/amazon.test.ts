import { GET } from "../route";
import axios from "axios";
import { load } from "cheerio";
import * as fs from "fs";
import * as path from "path";

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
    expect(json.amazon.items).toHaveLength(1); // Assuming only one main item is found

    const amazonItem = json.amazon.items[0];
    expect(amazonItem.format).toBe("Paperback");
    expect(amazonItem.quality).toBe(
      "Shipped promptly within 24hours. Book is in very good condition - 100% money back guarantee if customers are not satisfied.",
    );
  });
});
