import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 1400, deviceScaleFactor: 2 });
page.on("pageerror", e => console.log("PAGEERR:", e.message));
await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
// Page 12 = index 10 (Lat A)
await page.evaluate(() => document.querySelectorAll("aside button")[10].click());
await new Promise(r => setTimeout(r, 3500));

// Find the Problem and Solution textarea
const has = await page.evaluate(() => {
  const ta = document.querySelector("textarea");
  return !!ta;
});
console.log("Textarea present:", has);

// Type into it
await page.evaluate(() => {
  const ta = document.querySelector("textarea");
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
  setter.call(ta, "ทีมช่างเป็นทีมใหม่ ปุงในช่วงทดลองงาน — ทดสอบ");
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  ta.blur();
});
await new Promise(r => setTimeout(r, 1500));

const stored = await page.evaluate(() => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("dmp.note."));
  return keys.map(k => ({ k, v: localStorage.getItem(k) }));
});
console.log("Stored notes:", JSON.stringify(stored, null, 2));

// Capture
const box = await page.evaluate(() => {
  const ta = document.querySelector("textarea");
  // Find ChartCard wrapping the textarea
  let card = ta;
  for (let i = 0; i < 8 && card; i++) {
    if (card.style?.borderRadius === "12px") break;
    card = card.parentElement;
  }
  const r = card.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: "/tmp/note-card.png", clip: box });

// Reload and verify
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector("aside button");
await page.evaluate(() => document.querySelectorAll("aside button")[10].click());
await new Promise(r => setTimeout(r, 3000));
const reloadedText = await page.$eval("textarea", el => el.value);
console.log("After reload textarea:", reloadedText);
await browser.close();
