import { NextResponse } from 'next/server';

import axios from 'axios';
import { load } from 'cheerio';
import { ItemData, BookDetails } from '@/types';

/**
 * Parses a price string into a number.
 * @param priceText The text containing the price.
 * @returns The parsed price as a number, or NaN if parsing fails.
 */
function parsePrice(priceText: string): number {
  return parseFloat(priceText.replace(/[^0-9.]+/g, ''));
}

/**
 * Handles errors during scraping, logging them and returning an empty array of items.
 * @param scraperName The name of the scraper that failed.
 * @param error The error object.
 * @returns An empty array of ItemData.
 */
function handleScraperError(scraperName: string, error: unknown): ItemData[] {
  console.error(`Error scraping ${scraperName}:`, error);
  return [];
}

async function fetchBookDetails(barcode: string): Promise<BookDetails> {
  try {
    const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${barcode}`, { timeout: 5000 });
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
    console.error('Error fetching book details from Google Books API:', error);
  }
  return {};
}

async function scrapeEbay(barcode: string): Promise<ItemData[]> {
  try {
    const searchUrl = `https://www.ebay.co.uk/sch/i.html?_nkw=${barcode}&LH_BIN=1`; // Buy It Now only
    const { data: searchData } = await axios.get(searchUrl, { timeout: 10000 });
    const $ = load(searchData);
    const items: ItemData[] = [];

    const productLinks: string[] = [];
    $('.s-item__link').each((_, el) => {
      const link = $(el).attr('href');
      if (link && link.startsWith('http')) {
        productLinks.push(link);
      }
    });

    for (const link of productLinks) {
      const { data: productPageData } = await axios.get(link, { timeout: 10000 });
      const $$ = load(productPageData);

      const title = $$('.x-item-title__mainTitle .ux-textspans').text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        continue; // Skip this item if it's a bundle
      }

      const priceText = $$('.x-price-primary .ux-textspans').first().text();
      const canonicalLink = $$('link[rel="canonical"]').attr('href');
      const quality = $$('.x-item-condition-text .ux-textspans').first().text().trim();
      let format: string | undefined;

      // Try to extract format from item specifics if available
      $$('.ux-layout-section--item-details .ux-labels-values__labels').each((_, el) => {
        if ($$(el).text().trim() === 'Format:') {
          format = $$(el).next('.ux-labels-values__values').text().trim();
          return false; // Exit each loop
        }
      });

      if (priceText && canonicalLink) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({ price, link: canonicalLink, quality: quality || undefined, format: format || undefined });
        }
      }
    }
    return items;
  } catch (error) {
    return handleScraperError('eBay', error);
  }
}

async function scrapeAmazon(barcode: string): Promise<ItemData[]> {
  try {
    const searchUrl = `https://www.amazon.co.uk/s?k=${barcode}&i=stripbooks`;
    const { data: searchData } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });
    const $ = load(searchData);
    const items: ItemData[] = [];

    const productLinks: string[] = [];
    $('.s-result-item[data-asin] .a-link-normal.a-text-normal').each((_, el) => {
      const link = $(el).attr('href');
      if (link) {
        productLinks.push(`https://www.amazon.co.uk${link}`);
      }
    });

    for (const link of productLinks) {
      const { data: productPageData } = await axios.get(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      });
      const $$ = load(productPageData);

      const title = $$('#productTitle').text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        continue; // Skip this item if it's a bundle
      }

      const priceText = $$('.a-price-whole').first().text() + $$('.a-price-fraction').first().text();
      const canonicalLink = $$('link[rel="canonical"]').attr('href');
      let quality: string | undefined;
      let format: string | undefined;

      // Try to extract quality from the 'Used' section
      const usedConditionText = $$('#usedBuyBox .a-size-base').text();
      if (usedConditionText) {
        const match = usedConditionText.match(/Used - (.*?)(?:\s|$)/);
        if (match) {
          quality = match[1].trim();
        }
      }

      // Try to extract format from product details
      $$('#detailBullets_feature_div .a-list-item').each((_, el) => {
        const text = $$(el).text();
        if (text.includes('Paperback')) {
          format = 'Paperback';
          return false;
        } else if (text.includes('Hardcover')) {
          format = 'Hardcover';
          return false;
        } else if (text.includes('Board book')) {
          format = 'Board book';
          return false;
        }
      });

      if (priceText && canonicalLink) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({ price, link: canonicalLink, quality: quality || undefined, format: format || undefined });
        }
      }
    }
    return items;
  } catch (error) {
    return handleScraperError('Amazon', error);
  }
}

async function scrapeAbeBooks(barcode: string): Promise<ItemData[]> {
  try {
    const url = `https://www.abebooks.co.uk/products/${barcode}/plp`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = load(data);
    const items: ItemData[] = [];

    const title = $('#book-title .main-heading').text().toLowerCase();
    const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
    if (isBundle) {
      return []; // Skip this item if it's a bundle
    }

    const priceText = $('#book-price').text();
    const link = $('link[rel="canonical"]').attr('href');
    const quality = $('dl.listing-metadata dt:contains("Condition") + dd').text().trim();
    const format = $('dl.listing-metadata dt:contains("Binding") + dd').text().trim();

    if (priceText && link) {
      const price = parsePrice(priceText);
      if (!isNaN(price)) {
        items.push({ price, link, quality: quality || undefined, format: format || undefined });
      }
    }
    return items;
  } catch (error) {
    return handleScraperError('AbeBooks', error);
  }
}

async function scrapeWorldOfBooks(barcode: string): Promise<ItemData[]> {
  try {
    const url = `https://www.worldofbooks.com/en-gb/search/books?term=${barcode}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = load(data);
    const items: ItemData[] = [];

    const productLink = $('.product-card__title-link').attr('href');

    if (!productLink) {
      return [];
    }

    const productPageUrl = `https://www.worldofbooks.com${productLink}`;
    const { data: productData } = await axios.get(productPageUrl, { timeout: 10000 });
    const $$ = load(productData);

    const title = $$('.product-form__title').text().toLowerCase();
    const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
    if (isBundle) {
      return []; // Skip this item if it's a bundle
    }

    const scriptContent = $$('script#shop-js-analytics').html();

    if (scriptContent) {
      try {
        const jsonData = JSON.parse(scriptContent);
        if (jsonData.product && jsonData.product.variants) {
          const firstVariant = jsonData.product.variants[0];
          if (firstVariant) {
            const price = firstVariant.price / 100; // Price is in cents
            const link = $$('link[rel="canonical"]').attr('href');
            let quality: string | undefined;
            let format: string | undefined;

            if (firstVariant.public_title) {
              const publicTitle = firstVariant.public_title;
              let match = publicTitle.match(/(?<= \/ )[^/]+(?= \/)/);
              if (match) {
                quality = match[0].trim();
              }
              match = publicTitle.match(/(?<= \/ [^/]+ \/ ).*/);
              if (match) {
                format = match[0].trim();
              }
            }
            if (!isNaN(price) && link) {
              items.push({ price, link, quality: quality || undefined, format: format || undefined });
            }
          }
        }
      } catch (error) {
        console.error('Error parsing shop-js-analytics script:', error);
      }
    }
    return items;
  } catch (error) {
    return handleScraperError('WorldOfBooks', error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
  }

  try {
    const bookDetailsPromise = fetchBookDetails(barcode);

    const [bookDetails, ebayItems, abeBooksItems, worldOfBooksItems, amazonItems] =
      await Promise.all([
        bookDetailsPromise,
        scrapeEbay(barcode),
        scrapeAbeBooks(barcode),
        scrapeWorldOfBooks(barcode),
        scrapeAmazon(barcode),
      ]);

    const allItems = [...ebayItems, ...abeBooksItems, ...worldOfBooksItems, ...amazonItems];

    // Sort items by price in ascending order
    ebayItems.sort((a, b) => a.price - b.price);
    abeBooksItems.sort((a, b) => a.price - b.price);
    worldOfBooksItems.sort((a, b) => a.price - b.price);
    amazonItems.sort((a, b) => a.price - b.price);

    const minPriceItem = allItems.reduce((prev, current) => (prev.price < current.price ? prev : current));
    const maxPriceItem = allItems.reduce((prev, current) => (prev.price > current.price ? prev : current));

    const highestPriceItem = maxPriceItem;

    return NextResponse.json({
      bookDetails,
      ebay: {
        items: ebayItems,
      },
      abeBooks: {
        items: abeBooksItems,
      },
      worldOfBooks: {
        items: worldOfBooksItems,
      },
      amazon: {
        items: amazonItems,
      },
      summary: {
        minItem: minPriceItem,
        maxItem: maxPriceItem,
        highestItem: highestPriceItem,
      },
    });
    } catch (error) {
      console.error('Error in GET request:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data for the provided barcode.', details: (error as Error).message },
        { status: 500 }
      );
    }
  }
