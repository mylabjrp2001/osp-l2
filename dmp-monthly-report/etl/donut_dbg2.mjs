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
const donut = await page.evaluate(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  const w = ws[1]; // donut
  const svg = w.querySelector("svg");
  const sectors = w.querySelectorAll(".recharts-pie-sector");
  const sectorBoxes = Array.from(sectors).map(s => {
    const r = s.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const svgRect = svg?.getBoundingClientRect();
  return {
    wrapperW: w.clientWidth, wrapperH: w.clientHeight,
    svgW: svg?.clientWidth, svgH: svg?.clientHeight,
    svgRect,
    sectorBoxes,
    pieGroup: w.querySelector(".recharts-pie")?.getBoundingClientRect(),
  };
});
console.log(JSON.stringify(donut, null, 2));
await browser.close();
