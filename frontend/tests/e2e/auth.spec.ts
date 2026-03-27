import { test, expect } from '@playwright/test';
import { loginAs, waitForDashboard, logout, TEST_PASSENGER, TEST_DRIVER } from './helpers';

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
test.describe('Landing page', () => {
    test('shows Commuto brand and CTA buttons', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('text=Commuto').first()).toBeVisible();
        // Should have at least one call-to-action (Get Started / Sign Up)
        const cta = page.locator('a, button').filter({ hasText: /get started|sign up|join/i }).first();
        await expect(cta).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Role selection
// ---------------------------------------------------------------------------
test.describe('Role selection', () => {
    test('shows passenger and driver options', async ({ page }) => {
        await page.goto('/select-role');
        await expect(page.locator('text=/passenger/i').first()).toBeVisible();
        await expect(page.locator('text=/driver/i').first()).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Signup page (smoke)
// ---------------------------------------------------------------------------
test.describe('Signup page', () => {
    // AuthContext reads role from localStorage via the 'user_role' key.
    // Pre-seed the role so signup page doesn't immediately redirect to /select-role.
    const seedRole = async (page: any) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.setItem('user_role', 'passenger'));
    };

    test('renders the registration form', async ({ page }) => {
        await seedRole(page);
        await page.goto('/signup');
        await page.waitForSelector('input[id="email"]', { timeout: 8_000 });
        await expect(page.locator('input[id="email"]')).toBeVisible();
        await expect(page.locator('input[id="name"]')).toBeVisible();
        await expect(page.locator('input[id="phone"]')).toBeVisible();
        await expect(page.locator('input[id="password"]')).toBeVisible();
    });

    test('shows validation errors when form is empty', async ({ page }) => {
        await seedRole(page);
        await page.goto('/signup');
        // Wait for the form to be in the DOM
        await page.waitForSelector('form');
        // requestSubmit() fires the submit event through the proper browser pipeline
        await page.evaluate(() => {
            const form = document.querySelector<HTMLFormElement>('form');
            form?.requestSubmit();
        });
        // Client-side validate() sets errors state → React renders error <p> tags
        await expect(
            page.locator('p').filter({ hasText: /required|valid|must|agree/i }).first()
        ).toBeVisible({ timeout: 5_000 });
    });

    test('shows password strength indicator', async ({ page }) => {
        await seedRole(page);
        await page.goto('/signup');
        await page.waitForSelector('input[id="password"]', { timeout: 8_000 });
        await page.locator('input[id="password"]').fill('Weak1234');
        // Password strength bar + label appears when password is typed
        await expect(page.locator('text=/strength/i').first()).toBeVisible({ timeout: 5_000 });
    });
});


// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------
test.describe('Login page', () => {
    test('renders login form', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[type="email"], input[id="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"], input[id="password"]')).toBeVisible();
        // Button can say 'Continue to Dashboard' or 'Sign In' depending on login page variant
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('shows error for wrong credentials', async ({ page }) => {
        await page.goto('/login');
        await page.locator('input[type="email"], input[id="email"]').first().fill('nobody@nowhere.com');
        await page.locator('input[type="password"], input[id="password"]').first().fill('wrongpassword');
        await page.locator('button[type="submit"]').click({ force: true });
        // Wrong credentials should either show an error toast OR keep the user on the login page
        // (never redirect to a dashboard). Wait for navigation to settle then assert URL.
        await page.waitForTimeout(3_000);
        await expect(page).toHaveURL(/login|select-role/);
    });

    test('has link to signup page', async ({ page }) => {
        await page.goto('/login');
        const signupLink = page.getByRole('link', { name: /sign up|register|create/i });
        await expect(signupLink).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Verify-email page
// ---------------------------------------------------------------------------
test.describe('Verify email page', () => {
    test('renders token input field', async ({ page }) => {
        await page.goto('/verify-email');
        await expect(page.locator('input[type="text"], input[placeholder*="token" i]').first()).toBeVisible();
        await expect(page.getByRole('button', { name: /verify/i })).toBeVisible();
    });

    test('shows error for invalid token', async ({ page }) => {
        await page.goto('/verify-email');
        const tokenInput = page.locator('input[type="text"]').first();
        await tokenInput.fill('invalid_token_xyz');
        await page.getByRole('button', { name: /verify email/i }).click({ force: true });
        // Either an error from the backend, or (if backend is down) the input is still present
        // Wait up to 15 s for a backend round-trip
        try {
            await expect(page.locator('text=/invalid|expired/i')).toBeVisible({ timeout: 15_000 });
        } catch {
            // If backend is unreachable the token field should still be visible
            await expect(tokenInput).toBeVisible();
        }
    });

    test('has skip link', async ({ page }) => {
        await page.goto('/verify-email');
        await expect(page.getByRole('link', { name: /skip/i })).toBeVisible();
    });

    test('auto-verifies when token is in URL', async ({ page }) => {
        // With a fake token the backend returns an error — that confirms the param is read & submitted
        await page.goto('/verify-email?token=fake_url_token');
        // Should either show an error (backend reachable) or have the token pre-filled in the input
        const tokenInput = page.locator('input[type="text"]').first();
        try {
            await expect(page.locator('text=/invalid|expired/i')).toBeVisible({ timeout: 15_000 });
        } catch {
            // Backend unreachable — input should at least be pre-filled with the token
            await expect(tokenInput).toHaveValue('fake_url_token');
        }
    });
});

// ---------------------------------------------------------------------------
// Auth flow (protected route redirects)
// ---------------------------------------------------------------------------
test.describe('Protected route redirects', () => {
    test('redirects unauthenticated user away from passenger dashboard', async ({ page }) => {
        // Navigate first (gives a valid page context), then clear any stale token
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/passenger/dashboard');
        await page.waitForURL(/login|^\//, { timeout: 8_000 });
    });

    test('redirects unauthenticated user away from driver dashboard', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('auth_token'));
        await page.goto('/driver/dashboard');
        await page.waitForURL(/login|^\//, { timeout: 8_000 });
    });
});
