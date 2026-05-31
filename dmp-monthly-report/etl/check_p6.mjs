import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[4].click());
await new Promise(r => setTimeout(r, 2500));
// Capture first chart (Job Done Per Day)
const charts = await page.$$(".recharts-wrapper");
await charts[0].screenshot({ path: "/tmp/p6-chart-new.png" });
const subtitle = await page.evaluate(() => document.querySelector("main p, main div[style*='subtitle'], main h1 + div")?.textContent || "");
console.log("subtitle area near header:");
await page.evaluate(() => {
  const items = document.querySelectorAll("main div");
  for (const it of items) {
    const t = it.textContent || "";
    if (t.includes("เป้า") && t.length < 400) console.log(t);
  }
});
await browser.close();
