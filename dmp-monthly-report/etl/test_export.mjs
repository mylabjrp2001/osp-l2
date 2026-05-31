import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1000 });

// Listen for download
const downloadDir = "/tmp/exports";
fs.mkdirSync(downloadDir, { recursive: true });
const cdp = await page.target().createCDPSession();
await cdp.send("Browser.setDownloadBehavior", {
  behavior: "allow",
  downloadPath: downloadDir,
});

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("CON: " + m.text()); });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await new Promise(r => setTimeout(r, 1500));

// Click PDF button
const clicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const pdfBtn = btns.find(b => b.textContent.trim() === "📄PDF" || b.textContent.includes("PDF"));
  if (pdfBtn) { pdfBtn.click(); return true; }
  return false;
});
console.log("PDF button clicked:", clicked);

// Wait for export to finish — overlay disappears
const t0 = Date.now();
while (Date.now() - t0 < 600000) {
  const hasOverlay = await page.evaluate(() =>
    !!document.querySelector("div[style*='กำลัง Export']") ||
    [...document.querySelectorAll("div")].some(d => d.textContent.includes("กำลัง Export"))
  );
  if (!hasOverlay) break;
  await new Promise(r => setTimeout(r, 1500));
}
await new Promise(r => setTimeout(r, 3000)); // wait a bit more for download

const files = fs.readdirSync(downloadDir);
console.log("Files downloaded:", files);
const pdfs = files.filter(f => f.endsWith(".pdf"));
if (pdfs.length) {
  const stat = fs.statSync(`${downloadDir}/${pdfs[0]}`);
  console.log(`PDF: ${pdfs[0]} (${(stat.size/1024).toFixed(0)} KB)`);
}
if (errors.length) console.log("Errors during export:", errors.slice(0, 5));
await browser.close();
