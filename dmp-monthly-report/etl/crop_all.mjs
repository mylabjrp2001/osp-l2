import puppeteer from "puppeteer";
import fs from "fs";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
fs.mkdirSync("/tmp/dmp-charts", { recursive: true });
const PAGES = ["p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12","p13","p14","p15","p16","p17","p18","p19","p20","p21","p22"];
for (let i = 0; i < PAGES.length; i++) {
  await page.evaluate((idx) => document.querySelectorAll("aside button")[idx].click(), i);
  await new Promise(r => setTimeout(r, 2500));
  // Capture main content area
  const main = await page.$("main");
  if (main) await main.screenshot({ path: `/tmp/dmp-charts/${PAGES[i]}-main.png` });
}
await browser.close();
console.log("done", PAGES.length);
