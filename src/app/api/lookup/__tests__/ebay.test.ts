import { scrapeEbay } from "../route";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("eBay Scraper", () => {
  let ebayHtmlContent: string;

  beforeAll(() => {
    ebayHtmlContent = fs.readFileSync(
      path.resolve(process.cwd(), "typical/ebay_debug.html"),
      "utf-8",
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: ebayHtmlContent });
  });

  it("should correctly scrape items from eBay", async () => {
    const barcode = "1234567890"; // Dummy barcode
    const items = await scrapeEbay(barcode);

    // Add more specific assertions based on the content of typical/ebay.html
    // For now, let's just check if some items are returned.
    expect(items.length).toBeGreaterThan(0);

    // Example of a more specific assertion (adjust based on actual HTML content)
    // expect(items[0]).toEqual({
    //   price: expect.any(Number),
    //   link: expect.any(String),
    //   quality: expect.any(String),
    //   format: expect.any(String),
    // });
  });
});