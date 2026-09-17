# Gotchas — osp-l2 / DMP Monthly Report

## data อยู่นอก git

`server/storage/` ถูก `.gitignore` ตั้งแต่ต้น — ในนั้นคือของจริงทั้งหมด:
`excel/Data Job done 2025.xlsx` (45 MB) · `excel/Data Job done 2026.xlsx` (47 MB) · `data.json` (29 MB)

ตอนย้ายเครื่อง **`git clone` อย่างเดียวได้แอปเปล่า** ต้อง rsync `storage/` ตามไปด้วย
บน prod ผูกไว้ที่ `/srv/data/dmp-report` ผ่าน env `DMP_STORAGE=/data`

`Excel Data/` ที่อยู่ใน git เป็นไฟล์ชุดเก่า (พ.ค. 2026) ที่ ETL รุ่นเดิม (`npm run etl`) ใช้
**ไม่ใช่** ชุดที่แอปใช้จริง — อย่าเอาไปทับ `storage/excel/`

## `public/data.json` ไม่มีใน git

`**/public/data.json` ถูก ignore และ `public/` ไม่มีไฟล์อื่นเลย → clone ใหม่จะไม่มีโฟลเดอร์ `public/`
Vite build ผ่านปกติ และไม่ต้องมีด้วย เพราะ `/data.json` ถูก route ของ FastAPI ดักไว้ก่อน
SPA fallback อยู่แล้ว (`@app.get("/data.json")` ประกาศก่อน `@app.get("/{full_path:path}")`)

## ลำดับ route ใน `server/app.py`

catch-all `@app.get("/{full_path:path}")` ที่เสิร์ฟ SPA ถูกประกาศ**ท้ายสุด**โดยตั้งใจ
ถ้าย้าย/เพิ่ม route ใหม่ ต้องวางไว้ **เหนือ** มัน ไม่งั้นโดน SPA กลืนหมด

## pm2 บน Mac mini bind 127.0.0.1 ไม่ใช่ 0.0.0.0

`ecosystem.config.cjs` เขียน `--host 0.0.0.0` แต่ process ที่รันจริงถูกสตาร์ตด้วย
`--host 127.0.0.1` (เห็นได้ใน `~/.pm2/dump.pm2`) — เข้าถึงได้เฉพาะจากตัวเครื่อง
ที่เข้าจากข้างนอกได้เพราะ cloudflared รันบนเครื่องเดียวกัน

## tunnel บน Mac mini อาจถือหลายโดเมน

tunnel `bc1b056d…` (บัญชี `64b63ea2…`) รันเป็น launch daemon บน Mac mini
อย่าย้ายด้วยการเอา token ไปรันบน .4 — Mac mini ยังมี Nextcloud `:7737` ที่อาจใช้ tunnel เดียวกัน
และ token เดียวกันรัน 2 ที่ = Cloudflare กระจาย request ไปทั้งสองเครื่อง
ให้เพิ่ม hostname บน tunnel `ed36e902…` ของ .4 แล้วสลับ CNAME แทน (ดู `deploy/runbooks/deploy.md`)

## ETL กินแรมตอน upload

`server/etl.py` ใช้ `openpyxl.load_workbook(read_only=True, data_only=True)` (streaming)
แต่ยังต้อง build `records[]` ทั้งก้อนในหน่วยความจำก่อนเขียน `data.json` 29 MB
compose ตั้ง limit ไว้ 4 GB — ถ้าปีถัดไปไฟล์โตขึ้นมากแล้ว container โดน OOM kill ให้ขยับตรงนี้

## `vite.config.js` — `allowedHosts`

มี `l2.bankjrplab.online` ค้างไว้ ใช้เฉพาะ dev server (`npm run dev`) ไม่เกี่ยวกับ prod
prod เสิร์ฟ `dist/` ผ่าน uvicorn ล้วน ไม่มี Vite

## note ที่แก้ในหน้ารายงานอยู่ใน localStorage ของเบราว์เซอร์

`src/components/EditableNote.jsx` เก็บลง `localStorage` ไม่ได้ส่งขึ้น server
→ ตอนย้ายเครื่อง **note ไม่ต้องย้าย** เพราะผูกกับ origin ของโดเมน ไม่ใช่กับเครื่อง
แต่ถ้าวันไหนเปลี่ยน URL (เช่นไปใช้ `http://176.80.40.4:8000` แทน `https://l2.workproth.com`)
note ทั้งหมดจะหายไปจากสายตา (ยังอยู่ใน origin เดิม) — เป็นเหตุผลหนึ่งที่ต้องคง
โดเมนเดิมไว้ตอน cutover

server มีแค่ 4 route (`/api/status`, `/api/upload`, `/api/files/{name}`, `/data.json`)
ไม่มี state อื่นฝั่ง server นอกจาก `server/storage/` เลย

## ETL_VERSION — ต้อง bump ทุกครั้งที่ผลของ ETL เปลี่ยน

`server/etl.py` มี `ETL_VERSION` และเขียนลง `data.json` ตอน build
ตอน backend สตาร์ต (`_rebuild_if_stale` ใน `server/app.py`) ถ้า `etl_version` ใน `data.json` ไม่ตรง
และมีไฟล์ Excel อยู่ จะ rebuild ใน background thread เอง (~11 วิ ระหว่างนั้นเสิร์ฟไฟล์เก่า)
→ deploy ที่แก้ ETL **ไม่ต้องสั่ง rebuild มือ** แต่ถ้าลืม bump เลข ข้อมูลบน prod จะค้างสูตรเก่า
ดู log: `docker compose logs dmp-report | grep etl_version`

## Excel: duration ที่ ≥ 1 วัน มาเป็น `datetime(1900, …)` ไม่ใช่ `time`

openpyxl แปลงคอลัมน์ Accept to Depart / Depart to Onsite / Onsite to Done ที่ต่ำกว่า 24 ชม. เป็น `time`
แต่ ≥ 24 ชม. เป็น `datetime(1900,1,1,20,49,7)` (= 1 วัน 20:49:07) — ETL เดิมทิ้งเป็น null ทั้งหมด
(งานยาวหายจากค่าเฉลี่ย) · แก้แล้วใน `_excel_duration_datetime` (base ต่างกันก่อน/หลัง 1900-03-01
เพราะ openpyxl ชดเชย 29 ก.พ. 1900 ปลอมของ Excel)
ค่าที่เป็นวันที่จริง (ปี > 1900 — onsite ว่างแล้วสูตรลบออกมาเป็นวันที่) และค่าที่เกิน `MAX_DURATION_SEC`
(30 วัน) ถือเป็นข้อมูลผิด → null · `#VALUE!` ก็ null

## ไฟล์ Excel ไม่มีคอลัมน์ "Total Time"

ทั้งไฟล์ 2025 และ 2026 · ETL จึงคำนวณ `tt = REPORT_DATE − ACCEPT_DATE`
(ตรวจกับข้อมูลจริง: เท่ากับ ad + do + od ภายใน 1 นาที 98.5% ของแถว) · ถ้าวันหน้า Excel มีคอลัมน์นี้กลับมา
ค่าจากคอลัมน์จะถูกใช้ก่อน

## After Waive สะกดไม่สม่ำเสมอ

ค่าจริงที่เจอ: `Pass` · `Not Waive` · `รอ Defend` · และ `pass` ตัวเล็ก 118 แถว (ต.ค. 2025)
ETL ปรับตัวพิมพ์ให้เป็นค่ามาตรฐาน (`_canon`) — โค้ดหน้าเว็บเทียบ `=== "Pass"` ตรงตัวได้เลย
`รอ Defend` **ไม่ใช่ Not Waive**: ไม่นับเป็น pass แต่แถบ SLA ในหน้า Overview แยกเป็นสีส้ม "รอ Defend / ว่าง"

## เป้าหมาย (260/โซน · 86/ทีม) เป็นต่อเดือน

ใช้ `targetForRange(monthly, start, end)` ใน `src/utils.js` เสมอ — คูณด้วยจำนวนเดือนที่ช่วงครอบคลุม
(เดือนไม่เต็มคิดตามสัดส่วนวัน) · เป้าต่อวัน = `targetForRange(...) / rangeDays(...)`
กราฟ "ต่อวัน" ใช้ `dailyRows()` ที่คีย์ด้วยวันที่เต็ม — ห้ามกลับไปจัดกลุ่มด้วย `dayOfMonth` (ช่วงหลายเดือนจะทับกัน)

## วันที่ฝั่ง frontend ห้ามผ่าน `toISOString()`

แปลงเป็น UTC → ในเวลาไทย (UTC+7) ได้วันก่อนหน้า 1 วัน (Gantt preset "7 วัน" เคยได้ 8 วัน)
ใช้ `addDaysISO` / `toISODate` ใน `src/utils.js`

## ตั้งใจให้เป็นแบบนี้ — ไม่ใช่บั๊ก (เจ้าของยืนยัน 17 ก.ย. 2026)

audit รอบหน้าไม่ต้องรายงานซ้ำ:
- **API ไม่มีระบบ login / `server/storage` ไม่อยู่ในชุด backup** — เจ้าของรับทราบ
- **หน้า 22 KPI SLA ใช้ priority ตามตัวกรอง** (ต่างจากหน้า 5, 9–18 ที่ fix Critical + Major) —
  ให้ผู้ใช้เลือกเองว่าจะนับจาก priority ไหน
- **หน้า D2 งานรอลงข้อมูล แสดงเฉพาะทีม DMP** — ตัวกรองโซนตัดทีมอื่นออกโดยตั้งใจ
- **อัปโหลดทับไฟล์ปีเดิมก่อน ETL ตรวจ** — ถ้าไฟล์เสีย ไฟล์เก่าหาย รับได้

## ไฟล์ .bat สำหรับ Windows (start.bat · dev.bat · scripts/setup-windows.bat)

- **ต้องเป็น CRLF** — `.gitattributes` บังคับให้แล้ว ถ้าเป็น LF, cmd.exe อ่าน label / บล็อก `( )` เพี้ยน
- **เรียก npm ต้องมี `call`** (`call npm ci`) — `npm` เป็น `npm.cmd` ถ้าไม่ `call` batch จะจบตรงนั้นทันที
- **ข้อความใน .bat ใช้ภาษาอังกฤษล้วน** — ภาษาไทยขึ้นกับ code page ของ console มักเป็นตัวอ่านไม่ออก
- ใช้ `py -3` ก่อน `python` — Windows ที่ลงใหม่ `python` อาจเป็นตัวลัดไป Microsoft Store (exit 9009)
- ห้ามใส่ `(` `)` ในข้อความ `echo` ที่อยู่ในบล็อก `if (...)` — cmd จะนึกว่าปิดบล็อก
- ข้อมูลตั้งต้นของเครื่อง local มาจาก `Excel Data/` (คัดครั้งแรกครั้งเดียว) · ถ้าอัปเดตไฟล์ในโฟลเดอร์นั้น
  เครื่องที่เคยรันแล้วจะไม่ได้ของใหม่จนกว่าจะลบ `server/storage/`
- ทดสอบ .bat จริงจาก Mac ไม่ได้ — ส่วน Python/ETL/เซิร์ฟเวอร์จำลองบน Mac ผ่านแล้ว (17 ก.ย. 2026)
  แต่ต้องให้คนใช้ Windows ลองดับเบิลคลิกครั้งแรก
- บน Windows แทนที่ไฟล์ที่มีคนเปิดอยู่ไม่ได้ (`PermissionError`) — ETL retry แทนที่ `data.json` ~5 วิแล้ว
