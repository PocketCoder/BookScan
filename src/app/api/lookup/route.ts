import { NextResponse } from "next/server";

import axios from "axios";
import { load } from "cheerio";
import { ItemData, BookDetails } from "@/types";

/**
 * Parses a price string into a number.
 * @param priceText The text containing the price.
 * @returns The parsed price as a number, or NaN if parsing fails.
 */
function parsePrice(priceText: string): number {
  return parseFloat(priceText.replace(/[^0-9.]+/g, ""));
}

/**
 * Handles errors during scraping, logging them and returning an empty array of items.
 * @param scraperName The name of the scraper that failed.
 * @param error The error object.
 * @returns An empty array of ItemData.
 */
function handleScraperError(scraperName: string, error: unknown): ItemData[] {
  throw error; // Re-throw the error
}

async function fetchBookDetails(barcode: string): Promise<BookDetails> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${barcode}`,
      { timeout: 5000 },
    );
    const data = response.data;

    if (data.items && data.items.length > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      return {
        title: volumeInfo.title,
        authors: volumeInfo.authors,
        coverImage: volumeInfo.imageLinks?.thumbnail,
        format: volumeInfo.printType,
      };
    }
  } catch (error) {
    throw error; // Re-throw the error
  }
  return {};
}

async function scrapeEbay(barcode: string): Promise<ItemData[]> {
  try {
    const searchUrl = `https://www.ebay.co.uk/sch/i.html?_nkw=${barcode}&LH_BIN=1`; // Buy It Now only
    const { data: searchData } = await axios.get(searchUrl, { timeout: 10000 });

    const $ = load(searchData);
    const items: ItemData[] = [];

    $(".s-item").each((_, el) => {
      const $$ = load(el); // Load each item into its own cheerio instance

      const title = $$("div.s-card__title").text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return; // Skip this item if it's a bundle
      }

      const priceText = $$("span.s-card__price").text();
      const link = $$(".s-item__link").attr("href");
      const quality = $$("span.s-card__subtitle").text().trim();
      let format: string | undefined;

      // Try to extract format from title or subtitle
      if (title.includes("paperback")) {
        format = "Paperback";
      } else if (title.includes("hardcover")) {
        format = "Hardcover";
      } else if (quality.includes("paperback")) {
        format = "Paperback";
      } else if (quality.includes("hardcover")) {
        format = "Hardcover";
      }

      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({
            price,
            link,
            quality: quality || undefined,
            format: format || undefined,
          });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError("eBay", error);
  }
}

async function scrapeAmazon(barcode: string): Promise<ItemData[]> {
  try {
    const searchUrl = `https://www.amazon.co.uk/s?k=${barcode}&i=stripbooks`;
    const { data: searchData } = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });
    const $ = load(searchData);
    const items: ItemData[] = [];

    $(".s-result-item[data-asin]").each((_, el) => {
      const $$ = load(el); // Load each item into its own cheerio instance

      const title = $$("h2.a-size-medium.a-text-normal").text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return; // Skip this item if it's a bundle
      }

      const priceText = $$("span.a-price").first().text();
      const link = $$(".a-link-normal.a-text-normal").attr("href");
      const quality = $$('div[data-cy="secondary-offer-recipe"]').text().trim();
      const format = $$("div.a-row.a-size-base.a-color-base > a").text().trim();

      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({
            price,
            link: `https://www.amazon.co.uk${link}`,
            quality: quality || undefined,
            format: format || undefined,
          });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError("Amazon", error);
  }
}

async function scrapeWorldOfBooks(barcode: string): Promise<ItemData[]> {
  try {
    const url = `https://www.worldofbooks.com/en-gb/search?q=${barcode}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = load(data);
    const items: ItemData[] = [];

    $(".product-card").each((_, el) => {
      const $$ = load(el); // Load each item into its own cheerio instance

      const title = $$(".product-title").text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return; // Skip this item if it's a bundle
      }

      const priceText = $$(".price").text();
      const link = $$(".product-card__title-link").attr("href");
      const quality = $$(".condition").text().trim();
      const format = $$(".format").text().trim();

      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({
            price,
            link: `https://www.worldofbooks.com${link}`,
            quality: quality || undefined,
            format: format || undefined,
          });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError("WorldOfBooks", error);
  }
}

async function scrapeAbeBooks(barcode: string): Promise<ItemData[]> {
  try {
    const searchUrl = `https://www.abebooks.co.uk/servlet/SearchResults?sts=t&an=&tn=&isbn=${barcode}`;
    const { data: searchData } = await axios.get(searchUrl, { timeout: 10000 });
    const $ = load(searchData);
    const items: ItemData[] = [];

    $(".result-item").each((_, el) => {
      const $$ = load(el);

      const title = $$("div.result-detail h2 > a").text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return;
      }

      const priceText = $$("div.result-pricing span.x-large").text();
      const link = $$("div.result-detail h2 > a").attr("href");
      const quality = $$("p.item-description").text().trim();
      const format = $$("div.m-sm-b > span:last-child").text().trim();

      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({
            price,
            link: `https://www.abebooks.co.uk${link}`,
            quality: quality || undefined,
            format: format || undefined,
          });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError("AbeBooks", error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json({ error: "Barcode is required" }, { status: 400 });
  }

  try {
    const bookDetailsPromise = fetchBookDetails(barcode);

    const [
      bookDetails,
      ebayItems,
      worldOfBooksItems,
      amazonItems,
      abeBooksItems,
    ] = await Promise.all([
      bookDetailsPromise,
      scrapeEbay(barcode),
      scrapeWorldOfBooks(barcode),
      scrapeAmazon(barcode),
      scrapeAbeBooks(barcode),
    ]);

    const allItems = [
      ...ebayItems,
      ...worldOfBooksItems,
      ...amazonItems,
      ...abeBooksItems,
    ];

    // Sort items by price in ascending order
    ebayItems.sort((a, b) => a.price - b.price);
    worldOfBooksItems.sort((a, b) => a.price - b.price);
    amazonItems.sort((a, b) => a.price - b.price);
    abeBooksItems.sort((a, b) => a.price - b.price);

    let minPriceItem = null;
    let maxPriceItem = null;

    if (allItems.length > 0) {
      minPriceItem = allItems.reduce((prev, current) =>
        prev.price < current.price ? prev : current,
      );
      maxPriceItem = allItems.reduce((prev, current) =>
        prev.price > current.price ? prev : current,
      );
    }

    const highestPriceItem = maxPriceItem;

    return NextResponse.json({
      bookDetails,
      ebay: {
        items: ebayItems,
      },
      worldOfBooks: {
        items: worldOfBooksItems,
      },
      amazon: {
        items: amazonItems,
      },
      abeBooks: {
        items: abeBooksItems,
      },
      summary: {
        minItem: minPriceItem,
        maxItem: maxPriceItem,
        highestItem: highestPriceItem,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch data for the provided barcode.",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
