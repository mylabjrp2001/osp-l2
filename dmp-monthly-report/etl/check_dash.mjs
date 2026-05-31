import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 2 });
page.on("pageerror", e => console.log("PAGEERR:", e.message));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Set filter to "ทั้งหมด" so we see lots of pending data
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const all = btns.find(b => b.textContent.trim() === "ทั้งหมด");
  all?.click();
});
await new Promise(r => setTimeout(r, 500));
// Click D1
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("aside button"));
  const d1 = btns.find(b => b.textContent.includes("Solution Summary"));
  d1?.click();
});
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: "/tmp/dash-d1.png", fullPage: true });
// Click D2
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("aside button"));
  const d2 = btns.find(b => b.textContent.includes("รอลงข้อมูล"));
  d2?.click();
});
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: "/tmp/dash-d2.png", fullPage: true });
await browser.close();
