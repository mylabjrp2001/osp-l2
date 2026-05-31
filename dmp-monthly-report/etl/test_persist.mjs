import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await new Promise(r => setTimeout(r, 1000));

// Change filter: click "ก.พ. 69" preset
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const feb = btns.find(b => b.textContent.trim() === "ก.พ. 69");
  feb?.click();
});
await new Promise(r => setTimeout(r, 500));

// Toggle off "Latkrabang" zone chip
await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const z = btns.find(b => b.textContent.trim() === "Latkrabang");
  z?.click();
});
await new Promise(r => setTimeout(r, 500));

// Read localStorage
const stored = await page.evaluate(() => localStorage.getItem("dmp.filters.v1"));
console.log("After interaction:", stored);

// Read current date inputs
const dateInputs = await page.$$eval("input[type=date]", els => els.map(e => e.value));
console.log("Date inputs:", dateInputs);

// Reload page
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await new Promise(r => setTimeout(r, 1000));

const dateInputsAfter = await page.$$eval("input[type=date]", els => els.map(e => e.value));
console.log("Date inputs after reload:", dateInputsAfter);

// Check zone chips state — Latkrabang should be inactive
const zoneStates = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll("button"));
  const latk = btns.find(b => b.textContent.trim() === "Latkrabang");
  const path = btns.find(b => b.textContent.trim() === "Pathumthani");
  const styleHas = (el, kw) => el?.getAttribute("style")?.toLowerCase().includes(kw.toLowerCase()) ?? false;
  return {
    latkColor: latk?.style.color,
    pathColor: path?.style.color,
  };
});
console.log("Zone chip colors after reload:", zoneStates);

await browser.close();
