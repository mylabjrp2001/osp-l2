import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[4].click());
await new Promise(r => setTimeout(r, 3000));
const charts = await page.$$(".recharts-wrapper");
for (let i = 0; i < charts.length; i++) {
  await charts[i].screenshot({ path: `/tmp/p6-chart${i}.png` });
}
await browser.close();
console.log("captured", charts.length);
