import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Page 12 = index 10 (p2..p12 → 10)
await page.evaluate(() => document.querySelectorAll("aside button")[10].click());
await page.waitForSelector(".recharts-wrapper");
await page.waitForFunction(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  return ws.length >= 3 && Array.from(ws).every(w => w.querySelectorAll("path, rect").length > 0);
}, { timeout: 10000 });
await new Promise(r => setTimeout(r, 1500));
// Capture row 1
const box = await page.evaluate(() => {
  const wrappers = document.querySelectorAll(".recharts-wrapper");
  let row = wrappers[0].parentElement;
  while (row && (!row.style?.display || row.style.display !== "grid")) row = row.parentElement;
  const r = row.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: "/tmp/p12-row1.png", clip: box });
await browser.close();
