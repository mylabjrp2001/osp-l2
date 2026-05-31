import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[9].click());
await page.waitForSelector(".recharts-wrapper");
// Wait for actual chart bars to be present
await page.waitForFunction(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  if (ws.length < 3) return false;
  return Array.from(ws).every(w => w.querySelectorAll(".recharts-bar-rectangle, .recharts-radial-bar-sector").length > 0);
}, { timeout: 10000 });
await new Promise(r => setTimeout(r, 1500));
// Find Row 1: parent of first 3 ChartCards
const box = await page.evaluate(() => {
  const wrappers = document.querySelectorAll(".recharts-wrapper");
  const first = wrappers[0];
  // Find the grid row
  let row = first.parentElement;
  while (row && (!row.style?.display || row.style.display !== "grid")) row = row.parentElement;
  if (!row) row = first.parentElement.parentElement;
  const r = row.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log("Row box:", box);
await page.screenshot({ path: "/tmp/p11-row1.png", clip: box });
await browser.close();
