import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[11].click());
// Wait for all expected chart paths to be present
await page.waitForFunction(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  if (ws.length < 3) return false;
  return Array.from(ws).every(w => w.querySelectorAll("path").length > 0);
}, { timeout: 15000 });
await new Promise(r => setTimeout(r, 3000));
// Use elementHandle.screenshot to capture only the donut card
const cardHandle = await page.evaluateHandle(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  let el = ws[1];
  for (let i = 0; i < 8 && el; i++) {
    if (el.style && el.style.borderRadius === "12px") return el;
    el = el.parentElement;
  }
  return el;
});
await cardHandle.screenshot({ path: "/tmp/donut3.png" });
await browser.close();
