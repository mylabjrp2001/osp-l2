import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
page.on("pageerror", e => console.log("PAGEERR:", e.message));
page.on("console", m => { if (m.type() === "error") console.log("CON:", m.text()); });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[11].click());
await new Promise(r => setTimeout(r, 4000));
const info = await page.evaluate(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  return Array.from(ws).map(w => ({
    w: w.clientWidth, h: w.clientHeight,
    paths: w.querySelectorAll("path").length,
    sectors: w.querySelectorAll(".recharts-pie-sector").length,
    texts: w.querySelectorAll("text").length,
  }));
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
