import { test, expect } from "@playwright/test";
test("home stays public, guest reporting works, and emergency stops photos", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A better street/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Quick Report ↗" }).first().click();
  await expect(
    page.getByRole("button", { name: "Continue as guest" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.getByRole("button", { name: "Yes / unsure" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Photo collection is paused",
  );
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await page.getByRole("button", { name: "No immediate emergency" }).click();
  await page
    .getByRole("textbox", { name: "Latitude", exact: true })
    .fill("42.36");
  await page
    .getByRole("textbox", { name: "Longitude", exact: true })
    .fill("-71.06");
  await page
    .getByRole("textbox", { name: "Public location description" })
    .fill("Public sidewalk near the library");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to photo" }).click();
  await expect(
    page.getByRole("heading", { name: "Show what you see." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue →", exact: true }),
  ).toBeDisabled();
});
test("unknown route has a useful fallback and layout fits narrow screens", async ({
  page,
}) => {
  await page.goto("/#/does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Page not found." }),
  ).toBeVisible();
  await page.goto("/");
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.viewport);
});
test("directory search uses official live records and keyboard selection", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByRole("combobox");
  await search.fill("Cambridge");
  await expect(page.getByRole("option").first()).toContainText("Cambridge");
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page.getByRole("heading", { name: "Cambridge." })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No Common reports yet" }),
  ).toBeVisible();
  await expect(
    page.getByText("Insufficient information to assess cleanliness.", {
      exact: false,
    }),
  ).toBeVisible();
});
