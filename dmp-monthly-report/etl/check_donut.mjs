import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Page 13 = index 11 (Latkrabang B has more variety)
await page.evaluate(() => document.querySelectorAll("aside button")[11].click());
await page.waitForSelector(".recharts-wrapper");
await page.waitForFunction(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  return ws.length >= 3 && Array.from(ws).every(w => w.querySelectorAll("path, rect").length > 0);
}, { timeout: 10000 });
await new Promise(r => setTimeout(r, 5000));
// Capture the Job by Priority card (second card in row 1)
const box = await page.evaluate(() => {
  const wrappers = document.querySelectorAll(".recharts-wrapper");
  // wrappers: 0=gauge, 1=donut, 2=jobdone
  const donut = wrappers[1];
  // walk up to the ChartCard wrapper (white card)
  let card = donut;
  for (let i = 0; i < 8 && card; i++) {
    if (card.style && card.style.borderRadius === "12px") break;
    card = card.parentElement;
  }
  const r = (card || donut).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log(box);
await page.screenshot({ path: "/tmp/donut.png", clip: box });
await browser.close();
