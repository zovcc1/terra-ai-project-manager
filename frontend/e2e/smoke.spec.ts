import { test, expect } from "@playwright/test";

test("has title and persona links", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/تيرّا/);

  // Check if personas are present
  const managerPersona = page.getByText("مدير المشروع");
  await expect(managerPersona).toBeVisible();

  // Click on Manager persona
  await managerPersona.click();

  // Expect to be on the manager dashboard
  await expect(page).toHaveURL(/\/manager\/dashboard/);
  await expect(page.getByRole("heading", { name: "لوحة التحكم" })).toBeVisible();
});
