import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1400 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[11].click());
await new Promise(r => setTimeout(r, 6000));
await page.screenshot({ path: "/tmp/donut_full.png", fullPage: true });
const card = await page.evaluate(() => {
  const ws = document.querySelectorAll(".recharts-wrapper");
  let card = ws[1];
  for (let i = 0; i < 8 && card; i++) {
    if (card.style && (card.style.boxShadow || card.style.borderRadius === "12px")) break;
    card = card.parentElement;
  }
  const r = card.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});
console.log("card box:", card);
await browser.close();
