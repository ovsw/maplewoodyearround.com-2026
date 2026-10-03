import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("the empty site loads with accessible content", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page).toHaveTitle(/Maplewood/);
  expect(errors).toEqual([]);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("a missing page returns 404", async ({ page }) => {
  const response = await page.goto("/missing-smoke-test-page");
  expect(response?.status()).toBe(404);
});

test("non-production sites block search indexing", async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_SITE_ENV === "production");
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
