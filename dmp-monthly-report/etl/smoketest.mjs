import puppeteer from "puppeteer";
import fs from "fs";

const URL = "http://localhost:5173/";
const PAGES = [
  "p2","p3","p4","p5","p6","p7","p8","p9","p10",
  "p11","p12","p13","p14","p15","p16","p17","p18",
  "p19","p20","p21","p22",
];

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
const failures = [];
page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
});
page.on("requestfailed", (req) =>
  failures.push(`REQ FAIL: ${req.url()} ${req.failure()?.errorText}`)
);

console.log("Loading", URL);
await page.goto(URL, { waitUntil: "networkidle0", timeout: 60_000 });
// Wait until data.json is loaded and FilterBar renders
await page.waitForSelector("aside button", { timeout: 30_000 });
console.log("App loaded — testing", PAGES.length, "pages\n");

fs.mkdirSync("/tmp/dmp-shots", { recursive: true });

for (const pid of PAGES) {
  errors.length = 0;
  failures.length = 0;
  await page.evaluate((pid) => {
    const btns = Array.from(document.querySelectorAll("aside button"));
    const labels = btns.map((b) => b.textContent);
    // The button text starts with the number; click by index in NAV
    const idx = ["p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12","p13","p14","p15","p16","p17","p18","p19","p20","p21","p22"].indexOf(pid);
    btns[idx]?.click();
  }, pid);
  await new Promise((r) => setTimeout(r, 2500));
  const screenshotPath = `/tmp/dmp-shots/${pid}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const status = errors.length ? "❌ " + errors.length + " errs" : "✅";
  console.log(`${pid}: ${status}`);
  if (errors.length) for (const e of errors) console.log("    ", e);
  if (failures.length) for (const e of failures) console.log("    ", e);
}

await browser.close();
console.log("\nDone. Screenshots in /tmp/dmp-shots/");
