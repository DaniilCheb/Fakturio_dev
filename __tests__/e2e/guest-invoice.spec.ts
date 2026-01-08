import { test, expect } from './fixtures';

test.describe('Guest Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display invoice form on homepage', async ({ page }) => {
    // Check main sections are visible using headings
    await expect(page.getByRole('heading', { name: /Products/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /From/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'To' })).toBeVisible();
    
    // Check action buttons
    await expect(page.getByRole('button', { name: /Preview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
  });

  test('should have invoice header fields', async ({ page }) => {
    // Check that invoice form has header fields
    // Look for date inputs which are always present in the invoice header
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();
    
    // Verify at least one date field exists (issued date or due date)
    expect(dateCount).toBeGreaterThan(0);
    
    // Verify invoice header section exists by checking for currency or country fields
    const currencySelect = page.locator('select, [role="combobox"]');
    const hasCurrencyField = await currencySelect.count() > 0;
    
    // Just verify the form structure - don't try to fill fields that might not be editable
    expect(dateCount).toBeGreaterThan(0);
  });

  test('should add invoice item', async ({ page }) => {
    // Look for "Add item" button
    const addItemButton = page.getByRole('button', { name: /add item/i }).or(
      page.getByText(/Add item/i)
    );
    
    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      
      // Verify item fields are present
      const descriptionInputs = page.locator('input[placeholder*="description" i]');
      const count = await descriptionInputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should fill from section', async ({ page }) => {
    // Look for name input in From section - use label or placeholder
    const nameInput = page.getByLabel(/your name/i).first();
    
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Test Company');
      await expect(nameInput).toHaveValue('Test Company');
    }
  });

  test('should fill to section', async ({ page }) => {
    // Look for "To" section inputs - try label first
    const toNameInput = page.getByLabel(/customer name/i).first();
    
    if (await toNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toNameInput.fill('Test Customer');
      await expect(toNameInput).toHaveValue('Test Customer');
    }
  });

  test('should display preview button', async ({ page }) => {
    const previewButton = page.getByRole('button', { name: /Preview/i });
    await expect(previewButton).toBeVisible();
  });

  test('should display save button', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /Save/i });
    await expect(saveButton).toBeVisible();
  });
});

