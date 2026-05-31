import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// page 9 = index 7 (p2..p9 → 7)
await page.evaluate(() => document.querySelectorAll("aside button")[7].click());
await new Promise(r => setTimeout(r, 2500));
const charts = await page.$$(".recharts-wrapper");
for (let i = 0; i < charts.length; i++) {
  await charts[i].screenshot({ path: `/tmp/p9-chart${i}.png` });
}
await browser.close();
console.log("captured", charts.length);
