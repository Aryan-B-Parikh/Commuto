/**
 * Shared test helpers and fixtures for Commuto E2E tests.
 */
import { Page, expect } from '@playwright/test';

export const TEST_PASSENGER = {
    email: 'e2e_passenger@commuto.test',
    password: 'Test@12345',
    name: 'E2E Passenger',
    phone: '9876543210',
    role: 'passenger' as const,
};

export const TEST_DRIVER = {
    email: 'e2e_driver@commuto.test',
    password: 'Test@12345',
    name: 'E2E Driver',
    phone: '9876543211',
    role: 'driver' as const,
    license: 'DL-TEST-001',
};

/** Navigate to login and fill the form. Returns after clicking submit. */
export async function loginAs(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
}

/** Wait for the dashboard to be visible after login. */
export async function waitForDashboard(page: Page) {
    await expect(page).toHaveURL(/\/(passenger|driver)\/dashboard/, { timeout: 10_000 });
}

/** Clear localStorage auth token (logout helper). */
export async function logout(page: Page) {
    await page.evaluate(() => localStorage.removeItem('auth_token'));
    await page.goto('/');
}

/** Navigate & wait for page to stabilise (no network pending). */
export async function gotoAndWait(page: Page, path: string) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
}
