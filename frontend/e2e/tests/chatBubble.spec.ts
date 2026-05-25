import { test, expect } from '@playwright/test';
import { ApiValidator } from '../utils/apiValidator';
import { AiCommandRequestSchema, AiCommandResponseSchema, ConfirmActionRequestSchema } from '../schemas/apiSchemas';

test.describe('AI Chat Bubble Flow', () => {
  test('User can open chat, send message, and receive response', async ({ page }) => {
    // Setup API validation
    const apiValidator = new ApiValidator(page);
    apiValidator.registerSchema({
      pathPattern: /\/api\/ai\/command/,
      method: 'POST',
      requestSchema: AiCommandRequestSchema,
      responseSchema: AiCommandResponseSchema,
      schemaName: 'AiCommand'
    });
    
    apiValidator.registerSchema({
      pathPattern: /\/api\/ai\/confirm\/\d+/,
      method: 'POST',
      requestSchema: ConfirmActionRequestSchema,
      schemaName: 'ConfirmAction'
    });
    
    await apiValidator.startListening();

    // 1. Login first to access chat bubble
    await page.goto('/login');
    await page.fill('input[name="username"]', 'manager');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // 2. Open chat bubble
    await page.click('button[aria-label="فتح المحادثة"]');
    await expect(page.locator('text=مساعد تيرّا الذكي')).toBeVisible();

    // 3. Send message
    await page.fill('input[placeholder="اكتب رسالتك للمساعد الذكي…"]', 'Move task 1 to review');
    await page.click('button[type="submit"]');

    // 4. Wait for response (look for the AI response text or typing indicator to disappear)
    // The test might need to wait for the API call to resolve. Playwright does this automatically on route waiting, but we can wait for response explicitly.
    await page.waitForResponse(response => response.url().includes('/api/ai/command') && response.status() === 200);

    // 5. Verify AI message is in the chat
    // Since AI generates dynamic text, we just verify another message from 'ت' appears
    const aiMessages = page.locator('div:has-text("ت")');
    await expect(aiMessages.last()).toBeVisible();
  });
});
