import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
page.on("pageerror", e => console.log("PAGEERR:", e.message));
page.on("console", m => { if (m.type() === "error") console.log("CON:", m.text()); });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[9].click());
await new Promise(r => setTimeout(r, 3000));
const info = await page.evaluate(() => {
  const wrappers = document.querySelectorAll(".recharts-wrapper");
  return Array.from(wrappers).map((w, i) => ({
    i,
    width: w.clientWidth,
    height: w.clientHeight,
    bars: w.querySelectorAll(".recharts-bar-rectangle, .recharts-radial-bar-sector, .recharts-pie-sector").length,
    parentW: w.parentElement?.clientWidth,
  }));
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
