import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Page 19 = index 17
await page.evaluate(() => document.querySelectorAll("aside button")[17].click());
await new Promise(r => setTimeout(r, 2500));
const main = await page.$("main");
await main.screenshot({ path: "/tmp/p19-new.png" });
await browser.close();
