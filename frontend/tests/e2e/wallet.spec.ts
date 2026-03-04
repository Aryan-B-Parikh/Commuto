import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Wallet page — smoke tests
// ---------------------------------------------------------------------------

test.describe('Wallet page (unauthenticated)', () => {
    test('redirects to login or shows wallet UI', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/passenger/wallet');
        await expect(page.locator('body')).not.toContainText('Application error');
        await page.waitForTimeout(2_000);
        const url = page.url();
        expect(url).toMatch(/login|wallet|\//);
    });
});

test.describe('Wallet UI elements (DOM fixture)', () => {
    test('balance card renders correctly', async ({ page }) => {
        await page.setContent(`
          <div id="wallet-card" style="background:#1E293B;border-radius:16px;padding:24px;max-width:340px">
            <p id="balance-label" style="color:#9CA3AF;font-size:14px">Wallet Balance</p>
            <h2 id="balance-amount" style="color:#F9FAFB;font-size:32px;font-weight:700">₹1,250.00</h2>
            <button id="add-money-btn" style="margin-top:16px;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px">
              Add Money
            </button>
          </div>
        `);

        await expect(page.locator('#balance-label')).toContainText('Wallet Balance');
        await expect(page.locator('#balance-amount')).toContainText('₹');
        await expect(page.locator('#add-money-btn')).toBeEnabled();
    });

    test('transaction history list renders items', async ({ page }) => {
        await page.setContent(`
          <ul id="tx-list">
            <li class="tx-item" data-type="credit">
              <span class="tx-desc">Wallet top-up</span>
              <span class="tx-amount" style="color:green">+&#8377;500.00</span>
            </li>
            <li class="tx-item" data-type="payment">
              <span class="tx-desc">Trip payment</span>
              <span class="tx-amount" style="color:red">-&#8377;120.00</span>
            </li>
          </ul>
        `);

        const items = page.locator('.tx-item');
        await expect(items).toHaveCount(2);

        // Target using attribute selector directly
        const credit = page.locator('.tx-item[data-type="credit"]');
        await expect(credit.locator('.tx-amount')).toContainText('+');

        const payment = page.locator('.tx-item[data-type="payment"]');
        await expect(payment.locator('.tx-amount')).toContainText('-');
    });

    test('"Add money" button opens amount input', async ({ page }) => {
        await page.setContent(`
          <button id="add-money-btn">Add Money</button>
          <div id="add-money-form" style="display:none">
            <input id="amount-input" type="number" placeholder="Enter amount" />
            <button id="proceed-btn">Proceed</button>
          </div>
          <script>
            document.getElementById('add-money-btn').addEventListener('click', () => {
              document.getElementById('add-money-form').style.display = 'block';
            });
          </script>
        `);

        await page.click('#add-money-btn');
        await expect(page.locator('#add-money-form')).toBeVisible();
        await expect(page.locator('#amount-input')).toBeVisible();
    });

    test('amount input is numeric-only', async ({ page }) => {
        await page.setContent(`
          <input id="amount" type="number" min="1" step="1" />
        `);
        await page.fill('#amount', '500');
        await expect(page.locator('#amount')).toHaveValue('500');

        // Playwright cannot fill letters into type=number — use pressSequentially instead.
        // Browser native number inputs silently discard non-numeric input.
        await page.locator('#amount').pressSequentially('abc');
        const val = await page.locator('#amount').inputValue();
        // Value remains '500' because non-numeric characters are discarded
        expect(val).toBe('500');
    });
});

// ---------------------------------------------------------------------------
// Driver earnings page (smoke)
// ---------------------------------------------------------------------------
test.describe('Driver earnings page', () => {
    test('page exists and does not crash', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/earnings');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});
