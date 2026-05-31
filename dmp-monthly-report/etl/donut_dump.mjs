import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
page.on("pageerror", e => console.log("PAGEERR:", e.message));
page.on("console", m => { if (m.type() === "error") console.log("CON:", m.text()); });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[11].click());
await new Promise(r => setTimeout(r, 5000));
const result = await page.evaluate(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  const w = ws[1];
  return {
    svgInner: w.querySelector("svg")?.outerHTML?.slice(0, 3000),
  };
});
console.log(result.svgInner);
await browser.close();
