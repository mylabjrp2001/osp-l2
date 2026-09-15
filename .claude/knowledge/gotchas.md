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
