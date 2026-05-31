import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[9].click());
await page.waitForSelector(".recharts-wrapper");
await new Promise(r => setTimeout(r, 7000));
// Capture only the dashboard area below the filter (skip top banner+filter)
const dashboard = await page.evaluate(() => {
  // Find the page content area below PageHeader
  const main = document.querySelector("main");
  const rect = main.getBoundingClientRect();
  // Find the dashboard grid (third div under main)
  const gridDivs = main.querySelectorAll(":scope > div");
  let target = null;
  for (const d of gridDivs) {
    if (d.textContent.includes("Total Job") && d.textContent.includes("Reason Overdue")) {
      target = d;
      break;
    }
  }
  if (!target) target = main;
  const r = target.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log(dashboard);
await page.screenshot({ path: "/tmp/p11-zoom.png", clip: dashboard });
await browser.close();
