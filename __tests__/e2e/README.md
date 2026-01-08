# E2E Tests with Playwright

This directory contains end-to-end tests for the Fakturio application.

## Test Structure

- `auth.spec.ts` - Authentication flow tests
- `guest-invoice.spec.ts` - Guest invoice creation (homepage)
- `dashboard.spec.ts` - Dashboard navigation and routes
- `invoice-flow.spec.ts` - Invoice creation and validation flows
- `fixtures.ts` - Shared test fixtures and utilities

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test auth.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

## Authentication

The tests handle authentication redirects. For full authenticated tests, you may need to:

1. Set up test user credentials in environment variables
2. Use Playwright's authentication state storage
3. Mock Clerk authentication for testing

## Test Environment

Tests run against `http://localhost:3000` by default. The Playwright config automatically starts the dev server if not running.

## Writing New Tests

1. Import from `./fixtures`:
```typescript
import { test, expect } from './fixtures';
```

2. Use descriptive test names:
```typescript
test('should complete invoice creation flow', async ({ page }) => {
  // Test code
});
```

3. Use Playwright's auto-waiting features - no manual `waitFor` needed in most cases.

4. Use semantic locators when possible:
```typescript
page.getByRole('button', { name: /Save/i })
page.getByLabel(/Invoice number/i)
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines. The Playwright config includes retry logic and proper timeouts for CI environments.

