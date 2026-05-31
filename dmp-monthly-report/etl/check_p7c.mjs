import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[5].click());
await page.waitForSelector(".recharts-wrapper");
await new Promise(r => setTimeout(r, 3500));
// Find the first ChartCard (Job Done Per day card)
const box = await page.evaluate(() => {
  const wrappers = document.querySelectorAll(".recharts-wrapper");
  // walk up to find the closest ancestor whose style has white bg / boxShadow
  let el = wrappers[0];
  for (let i = 0; i < 8 && el; i++) {
    if (el.style && (el.style.boxShadow || el.style.borderRadius === "12px")) break;
    el = el.parentElement;
  }
  const r = (el || wrappers[0]).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: "/tmp/p7-card2.png", clip: box });
await browser.close();
