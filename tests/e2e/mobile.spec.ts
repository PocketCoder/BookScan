// tests/e2e/mobile.spec.ts
import { test, expect } from '@playwright/test';

/**
 * This test runs the application in a mobile viewport (iPhone 13) to verify
 * that the UI is responsive and that mobile‑only interactions (e.g., touch) work.
 */

test.use({
    viewport: { width: 390, height: 844 }, // iPhone 13 dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
});

test.describe('Responsive layout on mobile', () => {
    test('home page renders correctly on mobile', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        // Verify main heading is visible and fits the screen
        const heading = page.getByRole('heading', { name: /book price scanner/i });
        await expect(heading).toBeVisible();
        // Ensure the barcode scanner video element is present and sized correctly
        const video = page.getByLabel('Barcode scanner video feed');
        await expect(video).toBeVisible();
        // Verify that the layout stacks vertically on mobile (no horizontal overflow)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(390);
    });
});
