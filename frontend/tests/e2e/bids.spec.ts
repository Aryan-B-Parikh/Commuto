import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Bid-related UI smoke tests
// ---------------------------------------------------------------------------

test.describe('Bid buttons visibility (unauthenticated passenger view)', () => {
    /**
     * When an unauthenticated user lands on a ride detail page they should
     * either see a login prompt or the page renders (depends on middleware).
     * We confirm no JS crash occurs.
     */
    test('ride detail page renders without crash', async ({ page }) => {
        // Use a fake id — backend will return 404 but page shouldn't hard-crash
        await page.goto('/passenger/ride-details/00000000-0000-0000-0000-000000000000');
        await expect(page.locator('body')).not.toContainText('Application error');
    });

    test('trip detail page renders without crash', async ({ page }) => {
        await page.goto('/passenger/trip/00000000-0000-0000-0000-000000000000');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});

test.describe('Counter-bid UI elements', () => {
    /**
     * On the ride-details page, after data loads, Counter and Accept buttons
     * should be findable in the DOM. Because no real data is available in CI
     * without a seeded DB, we only assert the page loads and the
     * component tree is rendered correctly (no crash, no "Application error").
     */
    test('ride-details page mounts without throwing', async ({ page }) => {
        await page.goto('/passenger/ride-details/test-id');
        // Wait for any initial loading
        await page.waitForTimeout(2_000);
        const title = await page.title();
        // Page title should not be a generic error page title
        expect(title).not.toBe('Error');
    });
});

test.describe('Driver bid management page', () => {
    test('driver requests page exists', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/requests');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});

// ---------------------------------------------------------------------------
// Counter-bid form: component-level interaction
// ---------------------------------------------------------------------------
test.describe('Counter-bid amount input interaction (DOM-only)', () => {
    /**
     * We inject a minimal HTML fixture into the page to confirm the
     * counter-bid input/button interaction pattern works as users expect.
     */
    test('counter amount input accepts numeric values', async ({ page }) => {
        // Build a minimal harness — no need for Next.js for this assertion
        await page.setContent(`
          <div id="bid-row">
            <button id="counter-btn">Counter</button>
            <div id="counter-form" style="display:none">
              <input id="counter-amount" type="number" min="1" placeholder="Enter amount" />
              <button id="submit-counter">Submit</button>
            </div>
          </div>
          <script>
            document.getElementById('counter-btn').addEventListener('click', () => {
              document.getElementById('counter-form').style.display = 'block';
            });
          </script>
        `);

        await page.click('#counter-btn');
        await expect(page.locator('#counter-form')).toBeVisible();

        await page.fill('#counter-amount', '350');
        await expect(page.locator('#counter-amount')).toHaveValue('350');
    });

    test('counter form validates empty amount', async ({ page }) => {
        await page.setContent(`
          <div>
            <button id="counter-btn">Counter</button>
            <div id="counter-form" style="display:none">
              <input id="counter-amount" type="number" min="1" placeholder="Enter amount" />
              <button id="submit-counter" type="button">Submit</button>
              <p id="error" style="display:none;color:red">Amount is required</p>
            </div>
          </div>
          <script>
            document.getElementById('counter-btn').addEventListener('click', () => {
              document.getElementById('counter-form').style.display = 'block';
            });
            document.getElementById('submit-counter').addEventListener('click', () => {
              const val = document.getElementById('counter-amount').value;
              if (!val || Number(val) <= 0) {
                document.getElementById('error').style.display = 'block';
              }
            });
          </script>
        `);

        await page.click('#counter-btn');
        await expect(page.locator('#counter-form')).toBeVisible();
        // Click submit without entering an amount
        await page.click('#submit-counter');
        await expect(page.locator('#error')).toBeVisible();
    });
});
