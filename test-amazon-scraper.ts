// Quick test of Amazon scraper
import axios from 'axios';
import { load } from 'cheerio';
import * as fs from 'fs';

function parsePrice(priceText: string): number {
    return parseFloat(priceText.replace(/[^0-9.]+/g, ''));
}

async function testAmazonScraper() {
    // Read the HTML file
    const searchData = fs.readFileSync('/Users/jake/Documents/code/pricerr/typical/amazon.html', 'utf-8');
    const $ = load(searchData);
    const items: any[] = [];

    $('.s-result-item[data-asin]').each((_, el) => {
        const item$ = $(el);

        const title = item$.find('h2.a-size-medium.a-text-normal').text().toLowerCase();
        const isBundle = /bundle|lot|set of|x books|books x/i.test(title);
        if (isBundle) {
            return;
        }

        const resultLink = item$.find('.a-link-normal.a-text-normal').attr('href');

        // Find format rows within the price section
        const formatRows = item$.find('div[data-cy="price-recipe"] div.a-row.a-spacing-mini.a-size-base.a-color-base');

        console.log(`Found ${formatRows.length} format rows`);

        if (formatRows.length > 0) {
            formatRows.each((_, formatEl) => {
                const format$ = $(formatEl);
                const formatLink = format$.find('a').first();
                const linkAttr = formatLink.attr('href');
                const link = linkAttr || resultLink;
                const format = formatLink.text().trim();

                // Find the price - it's in the next sibling div
                const nextRow = format$.next('div.a-row.a-size-base.a-color-base');
                const priceText = nextRow.find('span.a-price').first().text();
                const quality = item$.find('div[data-cy="secondary-offer-recipe"]').text().trim();

                console.log(`Format: ${format}, Price: ${priceText}`);

                const isPriceOrGarbage = /£|\$|[0-9]{1,3}\.[0-9]{2}|Print List|RRP:|Save/i.test(format);

                if (priceText && link && format && !isPriceOrGarbage) {
                    const price = parsePrice(priceText);
                    if (!isNaN(price)) {
                        items.push({
                            price,
                            link: `https://www.amazon.co.uk${link}`,
                            quality: quality || undefined,
                            format,
                        });
                    }
                }
            });
        }
    });

    console.log(`Total items found: ${items.length}`);
    console.log(JSON.stringify(items, null, 2));
}

testAmazonScraper();
