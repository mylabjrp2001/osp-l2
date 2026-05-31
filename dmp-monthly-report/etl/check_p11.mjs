import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// page 11 = index 9
await page.evaluate(() => document.querySelectorAll("aside button")[9].click());
await new Promise(r => setTimeout(r, 2500));
const main = await page.$("main");
await main.screenshot({ path: "/tmp/p11-new.png" });
await browser.close();
