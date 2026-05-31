import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[11].click());
await new Promise(r => setTimeout(r, 6000));
// Capture the donut card area precisely
await page.screenshot({ path: "/tmp/donut2.png", clip: { x: 580, y: 480, width: 290, height: 380 } });
await browser.close();
