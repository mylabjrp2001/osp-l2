import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// click Page 5 (index 3 in NAV: p2,p3,p4,p5,...)
await page.evaluate(() => document.querySelectorAll("aside button")[3].click());
await new Promise(r => setTimeout(r, 2500));
const header = await page.evaluate(() => document.querySelector("main div div div")?.textContent || "");
console.log("PAGE 5 HEADER:", header.slice(0, 200));
const main = await page.$("main");
await main.screenshot({ path: "/tmp/p5-check.png" });
await browser.close();
