import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const server = await createServer({
  server: { host: "127.0.0.1", port: 5189, strictPort: true },
});
await server.listen();
const browser = await chromium.launch();
await mkdir("tools/preview", { recursive: true });
try {
  for (const [label, width, height] of [
    ["desktop", 1440, 1100],
    ["mobile", 390, 844],
    ["small-mobile", 320, 720],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto("http://127.0.0.1:5189/");
    await page.getByRole("heading", { name: /A better street/ }).waitFor();
    await page.screenshot({
      path: `tools/preview/${label}.png`,
      fullPage: true,
    });
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    );
    if (!fits) throw Error(`Overflow at ${width}px`);
    await page.close();
  }
  console.log(
    "Desktop, mobile and 320px screenshots captured. No horizontal overflow.",
  );
} finally {
  await browser.close();
  await server.close();
}
