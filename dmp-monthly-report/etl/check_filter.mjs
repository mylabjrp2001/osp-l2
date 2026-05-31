import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 600 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await new Promise(r => setTimeout(r, 1500));
// Capture just the filter bar area at top of main
await page.screenshot({ path: "/tmp/filterbar.png", clip: { x: 280, y: 0, width: 1160, height: 220 } });
const labels = await page.$$eval("button", btns => btns.map(b => b.textContent?.trim()).filter(t => t && t.length < 30 && (t.includes("26") || t.includes("เดือน") || t.includes("ทั้งหมด"))));
console.log("Quick presets seen:", JSON.stringify(labels));
await browser.close();
