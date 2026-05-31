import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => {
  const b = [...document.querySelectorAll("aside button")].find(x => x.textContent.includes("KPI SLA"));
  b?.click();
});
await new Promise(r => setTimeout(r, 2500));
const box = await page.evaluate(() => {
  const d = [...document.querySelectorAll("main > div")].find(x => x.textContent.includes("KPI SLA % Per Team"));
  const r = d.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: "/tmp/p22-final.png", clip: box });
await browser.close();
