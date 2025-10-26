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
    const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${barcode}&LH_BIN=1`; // Buy It Now only
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = load(data);
    const items: ItemData[] = [];

    $('.s-item, .s-item__wrapper').each((_, el) => {
      const title = $(el).find('.s-item__title').text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return; // Skip this item if it's a bundle
      }

      const priceText = $(el).find('.s-item__price, .prc').first().text();
      let link = $(el).find('.s-item__link, a.s-item__link').attr('href');
      let quality: string | undefined;
      let format: string | undefined;

      const itemHtml = $(el).html();

      // Extract quality using regex (more robust)
      let match = itemHtml?.match(/(?<=<span class="ux-textspans">).*?(?=<\/span>)/);
      if (match) {
        quality = match[0].trim();
      } else {
        const itemText = $(el).text();
        if (itemText.includes('New') && !itemText.includes('Used')) {
          quality = 'New';
        } else if (itemText.includes('Used')) {
          quality = 'Used';
        } else if (itemText.includes('Collectible')) {
          quality = 'Collectible';
        } else {
          quality = $(el).find('.s-item__subtitle').text().trim();
        }
      }

      // Extract format using regex (more robust)
      match = itemHtml?.match(/(?<=Format:\s*<span class="ux-textspans">).*?(?=<\/span>)/i);
      if (match) {
        format = match[0].trim();
      } else {
        const itemText = $(el).text();
        if (itemText.includes('Paperback')) {
          format = 'Paperback';
        } else if (itemText.includes('Hardcover')) {
          format = 'Hardcover';
        } else if (itemText.includes('Mass Market Paperback')) {
          format = 'Mass Market Paperback';
        } else if (itemText.includes('Board book')) {
          format = 'Board book';
        }
      }

      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          if (!link.startsWith('http')) {
            link = `https://www.ebay.co.uk${link}`;
          }
          items.push({ price, link, quality: quality || undefined, format: format || undefined });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError('eBay', error);
  }
}

async function scrapeAmazon(barcode: string): Promise<ItemData[]> {
  try {
    const url = `https://www.amazon.co.uk/s?k=${barcode}&i=stripbooks`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });
    const $ = load(data);
    const items: ItemData[] = [];

    $('.s-result-item[data-asin]').each((_, el) => {
      const title = $(el).find('h2 span.a-text-normal').text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return; // Skip this item if it's a bundle
      }

      const priceText = $(el).find('.a-price-whole').text() + $(el).find('.a-price-fraction').text();
      let link = $(el).find('.a-link-normal.a-text-normal').attr('href');
      let quality: string | undefined;
      let format: string | undefined;

      const itemHtml = $(el).html();

      // Extract condition using regex (more robust)
      let match = itemHtml?.match(/(?<=<span class="a-truncate-full">Book is in ).*?(?= condition)/);
      if (!match) {
        match = itemHtml?.match(/(?<=Save with Used - ).*?(?=<)/);
      }
      if (match) {
        quality = match[0].trim();
      }

      // Extract format using regex (more robust)
      match = itemHtml?.match(/(?<=<span id="productSubtitle" class="a-size-medium a-color-secondary celwidget">\s*).*?(?=\s*–)/);
      if (!match) {
        match = itemHtml?.match(/(?<=Format: ).*?(?=<)/);
      }
      if (match) {
        format = match[0].trim();
      }

      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          if (!link.startsWith('http')) {
            link = `https://www.amazon.co.uk${link}`;
          }
          items.push({ price, link, quality: quality || undefined, format: format || undefined });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError('Amazon', error);
  }
}

async function scrapeAbeBooks(barcode: string): Promise<ItemData[]> {
  try {
    const url = `https://www.abebooks.com/servlet/SearchResults?kn=${barcode}`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = load(data);
    const items: ItemData[] = [];
    $('#srp-results .result-item').each((_, el) => {
      const title = $(el).find('.result-title').text().toLowerCase();
      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
      if (isBundle) {
        return; // Skip this item if it's a bundle
      }
      const priceText = $(el).find('.item-price').text();
      let link = $(el).find('.result-detail a').attr('href');
      if (link && !link.startsWith('http')) {
        link = `https://www.abebooks.com${link}`;
      }
      let quality: string | undefined;
      let format: string | undefined;

      const itemHtml = $(el).html();

      // Extract condition using regex (more robust)
      let match = itemHtml?.match(/(?<=<dt>Condition<\/dt>\s*<dd>).*?(?=<\/dd>)/);
      if (match) {
        quality = match[0].trim();
      }

      // Extract format using regex (more robust)
      match = itemHtml?.match(/(?<=<dt>Binding<\/dt>\s*<dd>).*?(?=<\/dd>)/);
      if (match) {
        format = match[0].trim();
      }
      if (priceText && link) {
        const price = parsePrice(priceText);
        if (!isNaN(price)) {
          items.push({ price, link, quality: quality || undefined, format: format || undefined });
        }
      }
    });
    return items;
  } catch (error) {
    return handleScraperError('AbeBooks', error);
  }
}

async function scrapeWorldOfBooks(barcode: string): Promise<ItemData[]> {

  try {

    const url = `https://www.wob.com/en-us/category/all?search=${barcode}`;

    const { data } = await axios.get(url, { timeout: 10000 });

    const $ = load(data);

    const items: ItemData[] = [];



    $('.product-card, .product-list-item').each((_, el) => {

      const title = $(el).find('.product-title, .item-title').text().toLowerCase();

      const isBundle = /bundle|lot|set of|x books|books x/i.test(title);

      if (isBundle) {

        return; // Skip this item if it's a bundle

      }

      const priceText = $(el).find('.price, .product-price').first().text();

      let link = $(el).find('a').attr('href');

      let quality: string | undefined;

      let format: string | undefined;



      const scriptContent = $('script#shop-js-analytics').html();

      if (scriptContent) {

        try {

          const jsonData = JSON.parse(scriptContent);

          if (jsonData.product && jsonData.product.variants) {

            const firstVariant = jsonData.product.variants[0];

            if (firstVariant && firstVariant.public_title) {

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

          }

        } catch (error) {

          console.error('Error parsing shop-js-analytics script:', error);

        }

      }



      if (!quality) {

        quality = $(el).find('.product-condition, .item-condition-text').first().text().trim();

        if (!quality) {

          const itemText = $(el).text();

          if (itemText.includes('New') && !itemText.includes('Used')) {

            quality = 'New';

          } else if (itemText.includes('Used')) {

            quality = 'Used';

          }

        }

      }



      if (!format) {

        const itemText = $(el).text();

        if (itemText.includes('Paperback')) {

          format = 'Paperback';

        } else if (itemText.includes('Hardback')) {

          format = 'Hardcover';

        } else if (itemText.includes('Mass Market Paperback')) {

          format = 'Mass Market Paperback';

        } else if (itemText.includes('Board book')) {

          format = 'Board book';

        }

      }



      if (priceText && link) {

        const price = parsePrice(priceText);

        if (!isNaN(price)) {

          if (!link.startsWith('http')) {

            link = `https://www.wob.com${link}`;

          }

          items.push({ price, link, quality: quality || undefined, format: format || undefined });

        }

      }

    });

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
