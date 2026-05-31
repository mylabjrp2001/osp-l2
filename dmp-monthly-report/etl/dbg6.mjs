import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
page.on("pageerror", (e) => console.log("PAGEERR:", e.message));
page.on("console", (m) => { if (m.type() === "error") console.log("CONERR:", m.text()); });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[4].click());
await new Promise(r => setTimeout(r, 3000));
const info = await page.evaluate(() => {
  const cards = document.querySelectorAll(".recharts-wrapper");
  return Array.from(cards).map(c => ({
    w: c.clientWidth,
    h: c.clientHeight,
    bars: c.querySelectorAll(".recharts-bar-rectangle").length,
    cats: c.querySelectorAll(".recharts-cartesian-axis-tick").length,
    parentW: c.parentElement?.clientWidth,
  }));
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "/tmp/p6-big.png", fullPage: true });
await browser.close();
