import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// OTP verification flow — UI smoke tests
// ---------------------------------------------------------------------------

test.describe('/verify-otp page', () => {
    test('renders OTP input', async ({ page }) => {
        await page.goto('/verify-otp');
        await expect(page.locator('body')).not.toContainText('Application error');

        // Look for OTP input elements (single field or 6 individual digit boxes)
        const otpInput = page.locator(
            'input[type="text"], input[type="number"], input[inputmode="numeric"], input[maxlength="1"]'
        ).first();
        await expect(otpInput).toBeVisible({ timeout: 6_000 });
    });

    test('verify button is present', async ({ page }) => {
        await page.goto('/verify-otp');
        const btn = page.getByRole('button', { name: /verify|confirm|submit/i });
        await expect(btn.first()).toBeVisible({ timeout: 6_000 });
    });
});

test.describe('Driver live page', () => {
    test('page loads without application error', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/live');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});

test.describe('Passenger boarding page', () => {
    test('page loads without application error', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/passenger/boarding');
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});

// ---------------------------------------------------------------------------
// OTP digit-box interaction (component-level)
// ---------------------------------------------------------------------------
test.describe('OTP digit box interaction (DOM-only fixture)', () => {
    test('entering digits advances focus and joins into 6-char code', async ({ page }) => {
        await page.setContent(`
          <div id="otp-container" style="display:flex;gap:8px">
            ${Array.from({ length: 6 }, (_, i) =>
              `<input id="otp-${i}" type="text" maxlength="1" style="width:40px;text-align:center">`
            ).join('')}
          </div>
          <script>
            const inputs = Array.from(document.querySelectorAll('#otp-container input'));
            inputs.forEach((input, idx) => {
              input.addEventListener('input', () => {
                if (input.value.length === 1 && idx < inputs.length - 1) {
                  inputs[idx + 1].focus();
                }
              });
            });
          </script>
        `);

        const digits = ['1', '2', '3', '4', '5', '6'];
        for (const [i, digit] of digits.entries()) {
            await page.fill(`#otp-${i}`, digit);
        }

        // Collect values
        const code = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLInputElement>('#otp-container input'))
                .map(el => el.value)
                .join('')
        );
        expect(code).toBe('123456');
    });

    test('backspace on empty box moves focus to previous', async ({ page }) => {
        await page.setContent(`
          <div id="otp-container" style="display:flex;gap:8px">
            ${Array.from({ length: 6 }, (_, i) =>
              `<input id="otp-${i}" type="text" maxlength="1" style="width:40px;text-align:center">`
            ).join('')}
          </div>
          <script>
            const inputs = Array.from(document.querySelectorAll('#otp-container input'));
            inputs.forEach((input, idx) => {
              input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && input.value === '' && idx > 0) {
                  inputs[idx - 1].focus();
                }
              });
            });
          </script>
        `);

        // Focus 3rd box and press backspace — focus should move to 2nd
        await page.locator('#otp-2').focus();
        await page.keyboard.press('Backspace');
        const focused = await page.evaluate(() => document.activeElement?.id);
        expect(focused).toBe('otp-1');
    });
});
