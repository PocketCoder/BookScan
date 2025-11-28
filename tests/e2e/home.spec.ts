// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
    test('loads correctly and displays main UI', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await expect(page).toHaveTitle(/BookCheck/i);
        // Verify main heading
        await expect(page.getByRole('heading', { name: /book price scanner/i })).toBeVisible();
        // Verify description text
        await expect(page.getByText(/scan a barcode or enter it manually/i)).toBeVisible();
        // Verify barcode scanner video element exists
        const video = page.getByLabel('Barcode scanner video feed');
        await expect(video).toBeVisible();
    });
});
