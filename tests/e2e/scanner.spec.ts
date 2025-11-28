// tests/e2e/scanner.spec.ts
import { test, expect } from '@playwright/test';

/**
 * Mock API response for a barcode lookup.
 * We'll use Playwright's route interception to stub the `/api/lookup` request.
 */
const mockResponse = {
    bookDetails: {
        title: 'Test Book',
        authors: ['Author One', 'Author Two'],
        coverImage: 'https://example.com/cover.jpg',
        format: 'Hardcover',
    },
    ebay: { items: [{ price: 10, link: 'https://example.com/ebay', quality: 'New', format: 'Hardcover' }] },
    worldOfBooks: { items: [] },
    abeBooks: { items: [{ price: 12, link: 'https://example.com/abebooks', quality: 'New', format: 'Hardcover' }] },
    amazon: { items: [{ price: 11, link: 'https://example.com/amazon', quality: 'New', format: 'Hardcover' }] },
    summary: {
        minItem: { price: 10, link: 'https://example.com/ebay', quality: 'New', format: 'Hardcover' },
        averageItem: { price: 11, link: 'https://example.com/amazon', quality: 'New', format: 'Hardcover' },
        highestItem: { price: 12, link: 'https://example.com/abebooks', quality: 'New', format: 'Hardcover' },
    },
};

test.describe('Scanner page', () => {
    test.beforeEach(async ({ page }) => {
        // Intercept the API call and return mock data
        await page.route(/\/api\/lookup/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockResponse),
            });
        });
    });

    test('displays results after scanning a barcode', async ({ page }) => {
        // Navigate directly with a barcode query param
        await page.goto('http://localhost:3000/scanner?barcode=1234567890123');

        // Wait for and verify book details are displayed
        await expect(page.getByRole('heading', { name: /test book/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/author one, author two/i)).toBeVisible();

        // Verify summary card values
        await expect(page.getByText(/lowest price:/i)).toBeVisible();
        await expect(page.getByText('£10.00').first()).toBeVisible();
        await expect(page.getByText(/highest price:/i)).toBeVisible();
        await expect(page.getByText('£12.00').first()).toBeVisible();

        // Verify price tables contain items
        await expect(page.getByRole('heading', { name: /ebay/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /amazon/i })).toBeVisible();
    });
});
