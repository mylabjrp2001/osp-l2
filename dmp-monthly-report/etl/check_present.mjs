import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000 });
page.on("pageerror", e => console.log("PAGEERR:", e.message));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Click page 3 (Priority All Zone) so we have something with bars + cards
await page.evaluate(() => document.querySelectorAll("aside button")[1].click());
await new Promise(r => setTimeout(r, 2000));
// Capture normal mode
await page.screenshot({ path: "/tmp/present-before.png" });
// Click Present button
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const p = btns.find(b => b.textContent.includes("Present"));
  p?.click();
});
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: "/tmp/present-after.png" });
await browser.close();
