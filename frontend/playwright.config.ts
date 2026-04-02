import { defineConfig, devices } from '@playwright/test';

/**
 * Commuto E2E test configuration.
 * Docs: https://playwright.dev/docs/test-configuration
 *
 * Run all tests:   npm run test:e2e
 * Open interactive UI: npm run test:e2e:ui
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const basePort = new URL(baseURL).port || '3000';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],

    /* Start the Next.js dev server before running tests in local dev  */
    webServer: process.env.CI
        ? undefined
        : {
              command: process.env.PLAYWRIGHT_DEV_COMMAND || `npm run dev -- --port ${basePort}`,
              url: baseURL,
              reuseExistingServer: true,
              timeout: 120_000,
          },
});
