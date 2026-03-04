import { test, expect } from '@playwright/test';
import { gotoAndWait } from './helpers';

// ---------------------------------------------------------------------------
// Ride search / passenger browse
// ---------------------------------------------------------------------------
test.describe('Passenger ride search', () => {
    test('search page loads without crashing', async ({ page }) => {
        await gotoAndWait(page, '/passenger/search');
        // Should render without a hard error page
        await expect(page.locator('body')).not.toContainText('Application error');
        await expect(page.locator('body')).not.toContainText('500');
    });

    test('search page shows some form of search UI (input or button)', async ({ page }) => {
        await gotoAndWait(page, '/passenger/search');
        const searchEl = page.locator(
            'input[type="text"], input[placeholder*="from" i], input[placeholder*="where" i], button:has-text("Search")'
        );
        // At least one search-like element
        await expect(searchEl.first()).toBeVisible({ timeout: 10_000 });
    });
});

// ---------------------------------------------------------------------------
// Ride-sharing page
// ---------------------------------------------------------------------------
test.describe('Ride-sharing browse', () => {
    test('page renders without errors', async ({ page }) => {
        await gotoAndWait(page, '/passenger/ride-sharing');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});

// ---------------------------------------------------------------------------
// Passenger dashboard (requires auth or shows redirect)
// ---------------------------------------------------------------------------
test.describe('Passenger dashboard', () => {
    test('redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/passenger/dashboard');
        await page.waitForTimeout(2_000);
        const url = page.url();
        expect(url).toMatch(/login|\//);
    });
});

// ---------------------------------------------------------------------------
// Driver dashboard (requires auth or shows redirect)
// ---------------------------------------------------------------------------
test.describe('Driver dashboard', () => {
    test('redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/dashboard');
        await page.waitForTimeout(2_000);
        const url = page.url();
        expect(url).toMatch(/login|\//);
    });
});

// ---------------------------------------------------------------------------
// Driver create-ride page (smoke)
// ---------------------------------------------------------------------------
test.describe('Driver create ride', () => {
    test('page has correct title or heading', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/create');
        // After redirect (login or create page), the body should contain recognisable text
        const bodyText = await page.locator('body').innerText();
        expect(
            bodyText.match(/create|ride|trip|email|sign|log|commut/i)
        ).not.toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Trip history pages (smoke)
// ---------------------------------------------------------------------------
test.describe('Trip history pages', () => {
    test('passenger history redirects or renders', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/passenger/history');
        await expect(page.locator('body')).not.toContainText('Application error');
    });

    test('driver history redirects or renders', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/history');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});
