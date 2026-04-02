import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// WebSocket reconnection backoff (Trip WS hook)
// ---------------------------------------------------------------------------

test.describe('Trip WebSocket reconnection', () => {
    test('reconnects with exponential backoff', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'test-token');
            const originalGetItem = localStorage.getItem.bind(localStorage);
            localStorage.getItem = (key: string) => {
                if (key === 'auth_token') {
                    return 'test-token';
                }
                return originalGetItem(key);
            };
            (window as any).__wsAttempts = [];
            (window as any).__wsTripAttempts = [];

            class MockWebSocket {
                static OPEN = 1;
                static CLOSED = 3;

                url: string;
                readyState = MockWebSocket.OPEN;
                onopen: (() => void) | null = null;
                onclose: (() => void) | null = null;
                onmessage: ((event: { data: string }) => void) | null = null;
                onerror: (() => void) | null = null;

                constructor(url: string) {
                    this.url = url;
                    const now = Date.now();
                    (window as any).__wsAttempts.push(now);
                    if (url.includes('/ws/trips/')) {
                        (window as any).__wsTripAttempts.push(now);
                    }
                    setTimeout(() => {
                        this.onopen?.();
                        setTimeout(() => {
                            this.readyState = MockWebSocket.CLOSED;
                            this.onclose?.();
                        }, 50);
                    }, 20);
                }

                send(_data: string) {}
                close() {
                    this.readyState = MockWebSocket.CLOSED;
                    this.onclose?.();
                }
            }

            (window as any).WebSocket = MockWebSocket as any;
            (globalThis as any).WebSocket = MockWebSocket as any;
        });

        await page.goto('/test/ws-reconnect');
        await page.waitForFunction(() => (window as any).__wsTripAttempts.length >= 3, { timeout: 10_000 });

        const attempts = await page.evaluate(() => (window as any).__wsTripAttempts as number[]);
        const intervals = [attempts[1] - attempts[0], attempts[2] - attempts[1]];

        expect(intervals[0]).toBeGreaterThanOrEqual(700);
        expect(intervals[1]).toBeGreaterThanOrEqual(900);
    });
});
