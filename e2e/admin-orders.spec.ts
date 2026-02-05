import { test, expect } from '@playwright/test';

test.describe('Admin orders page', () => {
  test('renders table with mocked data for admin session', async ({ page }) => {
    await page.route('**/api/auth/session**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            name: 'Admin',
            email: 'admin@example.com',
            role: 'admin',
          },
          expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    await page.route('**/api/admin/orders?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          page: 1,
          pageSize: 20,
          total: 1,
          items: [
            {
              id: 'order_1',
              artworkId: 'art_1',
              artistId: 'artist_1',
              buyerEmail: 'buyer@example.com',
              buyerName: 'Buyer',
              buyerPhone: null,
              amount: 12300,
              currency: 'eur',
              fee: 500,
              tax: 200,
              shipping: 800,
              net: 10800,
              stripeSessionId: 'sess_123',
              paymentIntentId: 'pi_123',
              status: 'paid',
              fulfillmentStatus: 'pending_shipment',
              fulfilledAt: null,
              billingAddress: {},
              shippingAddress: {},
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.goto('/admin/orders');

    await expect(page.getByRole('heading', { name: /Commandes/i })).toBeVisible();
    await expect(page.getByText('buyer@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /Appliquer/i })).toBeVisible();
  });
});
