import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Page 22 = index 20
await page.evaluate(() => document.querySelectorAll("aside button")[20].click());
await new Promise(r => setTimeout(r, 2500));
const box = await page.evaluate(() => {
  const cards = document.querySelectorAll("main > div");
  for (const c of cards) {
    if (c.textContent.includes("KPI SLA")) {
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
  }
  return null;
});
console.log(box);
if (box) await page.screenshot({ path: "/tmp/p22-new.png", clip: box });
else await page.screenshot({ path: "/tmp/p22-new.png", fullPage: true });
await browser.close();
