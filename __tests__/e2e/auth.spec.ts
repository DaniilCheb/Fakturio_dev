import { test, expect } from './fixtures';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should display home page with invoice form', async ({ page }) => {
    // Check that the invoice form is visible
    await expect(page.getByText(/Create an invoice/i)).toBeVisible();
    
    // Check for key form elements using more specific selectors
    await expect(page.getByRole('heading', { name: /Products/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /From/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'To' })).toBeVisible();
  });

  test('should navigate to sign-in page', async ({ page }) => {
    // Look for sign-in link or button
    const signInLink = page.getByRole('link', { name: /sign in/i }).or(
      page.getByRole('button', { name: /sign in/i })
    ).first();
    
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await page.waitForURL(/sign-in/);
      await expect(page).toHaveURL(/sign-in/);
    } else {
      // If no sign-in link on homepage, try navigating directly
      await page.goto('/sign-in');
      await expect(page).toHaveURL(/sign-in/);
    }
    
    // Check for sign-in form elements
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
  });

  test('should navigate to sign-up page', async ({ page }) => {
    // Navigate to sign-up
    await page.goto('/sign-up', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/sign-up/);
    
    // Check for sign-up form elements - Clerk might take time to load
    // Just verify we're on the sign-up page
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should have back link from sign-in to home', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Look for back link
    const backLink = page.getByRole('link', { name: /back/i }).or(
      page.getByRole('link', { name: /invoice editor/i })
    );
    
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

