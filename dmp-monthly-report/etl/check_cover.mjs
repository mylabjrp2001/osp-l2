import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await new Promise(r => setTimeout(r, 1500));
// Cover should be default (p1). Capture the cover area.
const box = await page.evaluate(() => {
  const cards = document.querySelectorAll("main > div");
  for (const c of cards) {
    if (c.textContent.includes("DMP Advance Solution Network (BKK)") && c.textContent.includes("Team Performance")) {
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
  }
  return null;
});
console.log(box);
if (box) await page.screenshot({ path: "/tmp/cover.png", clip: box });
else await page.screenshot({ path: "/tmp/cover.png", fullPage: true });
await browser.close();
