import { test, expect } from '@playwright/test';
for (const [width, height] of [[1440,900],[768,1024],[390,844],[320,700]]) {
 test(`approved homepage fits ${width}x${height}`, async ({page}, testInfo) => {
  await page.setViewportSize({width,height});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/A better street/})).toBeVisible();
  await expect(page.locator('.common-map-hero img')).toHaveAttribute('src', /boston-map-hero\.webp$/);
  expect(await page.locator('.common-approved-page').innerText()).not.toMatch(/\b(?:concept|demo)\b/i);
  await expect(page.locator('.approved-home-host .issue')).toHaveCount(4);
  await expect(page.getByText('Illustrative example reports only.',{exact:false})).toBeVisible();
  const layout = await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  expect(layout.scroll).toBeLessThanOrEqual(layout.viewport);
  await page.evaluate(async () => {
   await document.fonts.ready;
   const images = Array.from(document.querySelector('.approved-home-host')!.shadowRoot!.querySelectorAll('img'));
   await Promise.all(images.map(image => image.decode().catch(() => undefined)));
  });
  await page.screenshot({path:testInfo.outputPath(`viewport-${width}.png`)});
  await page.screenshot({path:testInfo.outputPath(`approved-${width}.png`),fullPage:true});
  await expect(page.locator('.approved-home-host script')).toHaveCount(0);
  await page.locator('[data-filter="road"]').click();
  await expect(page.locator('.approved-home-host .issue')).toHaveCount(1);
  await expect(page.locator('.approved-home-host .issue')).toContainText('Pothole');
 });
}
