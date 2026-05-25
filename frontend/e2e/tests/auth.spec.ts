import { test, expect } from '@playwright/test';
import { ApiValidator } from '../utils/apiValidator';
import { LoginRequestSchema, LoginResponseSchema } from '../schemas/apiSchemas';

test.describe('Authentication Flow', () => {
  test('User can login successfully', async ({ page }) => {
    // Setup API validation
    const apiValidator = new ApiValidator(page);
    apiValidator.registerSchema({
      pathPattern: /\/api\/auth\/login/,
      method: 'POST',
      requestSchema: LoginRequestSchema,
      responseSchema: LoginResponseSchema,
      schemaName: 'Login'
    });
    await apiValidator.startListening();

    // 1. Navigate to login
    await page.goto('/login');

    // 2. Fill credentials
    await page.fill('input[name="username"]', 'manager');
    await page.fill('input[name="password"]', 'password');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verify routing (should go to manager dashboard)
    await expect(page).toHaveURL(/\/manager\/dashboard/);
  });
});
