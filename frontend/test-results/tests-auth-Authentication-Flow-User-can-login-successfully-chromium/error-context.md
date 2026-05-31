# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/auth.spec.ts >> Authentication Flow >> User can login successfully
- Location: e2e/tests/auth.spec.ts:6:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { ApiValidator } from '../utils/apiValidator';
  3  | import { LoginRequestSchema, LoginResponseSchema } from '../schemas/apiSchemas';
  4  |
  5  | test.describe('Authentication Flow', () => {
  6  |   test('User can login successfully', async ({ page }) => {
  7  |     // Setup API validation
  8  |     const apiValidator = new ApiValidator(page);
  9  |     apiValidator.registerSchema({
  10 |       pathPattern: /\/api\/auth\/login/,
  11 |       method: 'POST',
  12 |       requestSchema: LoginRequestSchema,
  13 |       responseSchema: LoginResponseSchema,
  14 |       schemaName: 'Login'
  15 |     });
  16 |     await apiValidator.startListening();
  17 |
  18 |     // 1. Navigate to login
> 19 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  20 |
  21 |     // 2. Fill credentials
  22 |     await page.fill('input[name="username"]', 'manager');
  23 |     await page.fill('input[name="password"]', 'password');
  24 |
  25 |     // 3. Submit
  26 |     await page.click('button[type="submit"]');
  27 |
  28 |     // 4. Verify routing (should go to manager dashboard)
  29 |     await expect(page).toHaveURL(/\/manager\/dashboard/);
  30 |   });
  31 | });
  32 |
```
