import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[5].click());
await page.waitForSelector(".recharts-wrapper");
await new Promise(r => setTimeout(r, 2500));
// capture the whole first card (header + chart)
const card = await page.evaluate(() => {
  const wrappers = document.querySelectorAll(".recharts-wrapper");
  const card = wrappers[0].closest("div[style]");
  // walk up to find the white card
  let el = wrappers[0];
  while (el && !el.style?.background?.includes("#fff") && !el.style?.background?.includes("rgb(255")) {
    el = el.parentElement;
  }
  const r = (el || wrappers[0]).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: "/tmp/p7-card.png", clip: card });
await browser.close();
