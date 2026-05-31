import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await new Promise(r => setTimeout(r, 1500));
const box = await page.evaluate(() => {
  const divs = [...document.querySelectorAll("main div")];
  for (const d of divs) {
    const t = d.textContent || "";
    if (t.includes("(Team Performance)") && t.includes("Monthly Report") && t.includes("Bangkok")) {
      const r = d.getBoundingClientRect();
      if (r.height > 300) return { x: r.x, y: r.y, width: r.width, height: r.height };
    }
  }
  return null;
});
console.log(box);
if (box) await page.screenshot({ path: "/tmp/cover.png", clip: box });
await browser.close();
