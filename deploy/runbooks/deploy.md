# Deploy — DMP Monthly Report (osp-l2)

Prod = **baanmefai `176.80.40.4`** (bare metal) · Docker Compose · service `dmp-report` · พอร์ต `8000`

| อะไร | ที่ไหน |
|---|---|
| โค้ด | `/srv/apps/osp-l2` (git clone ล้วน) |
| data (Excel + data.json) | `/srv/data/dmp-report/` — **อยู่นอก git ห้ามลบ** |
| ทางเข้า | `https://l2.workproth.com` → Cloudflare Tunnel → `http://localhost:8000` |
| เครื่องเดิม | Mac mini `labbankjrp.local` — pm2 `dmp-report` ที่ `/Volumes/LABJRP2001/Powerbi` |

## deploy ปกติ

```bash
ssh baanmefai
cd /srv/apps/osp-l2
git pull
docker compose up -d --build dmp-report
docker compose logs -f --tail=50 dmp-report     # Ctrl+C ออก
curl -s localhost:8000/api/status | head -c 400
```

## ครั้งแรก (setup เครื่องใหม่)

```bash
ssh baanmefai
sudo mkdir -p /srv/data/dmp-report/excel
sudo chown -R ubuntu:ubuntu /srv/data/dmp-report
git clone git@github.com:mylabjrp2001/osp-l2.git /srv/apps/osp-l2
cd /srv/apps/osp-l2
docker compose up -d --build dmp-report
```

แล้วเอา data ขึ้น (จาก Mac mini ผ่าน Tailscale):

```bash
# บนเครื่อง dev
ssh macmini 'rsync -av --progress \
  /Volumes/LABJRP2001/Powerbi/dmp-monthly-report/server/storage/ \
  ubuntu@100.99.177.75:/srv/data/dmp-report/'
```

## rollback

```bash
ssh baanmefai 'cd /srv/apps/osp-l2 && docker compose stop dmp-report'
# แล้วเปิด cloudflared + pm2 ฝั่ง Mac mini กลับ (ดู cutover ด้านล่าง)
```

## cutover โดเมน `l2.workproth.com` — ทำไปแล้ว 16 ก.ย. 2026 ✅

ตอนนี้ `l2.workproth.com` เป็น **route ที่ 14** ของ tunnel `cloudflared` (`ed36e902…`) บน .4
ชี้ `http://localhost:8000` · ตรวจแล้ว `/api/status` ตอบ `"storage_dir":"/data"`
route เดิมบน tunnel `bc1b056d…` ของ Mac mini **ยังไม่ได้ลบ** และ pm2 ที่นั่นยังรันอยู่ (เผื่อ rollback)

ขั้นตอนด้านล่างเก็บไว้อ้างอิงถ้าต้องทำซ้ำ:

โดเมนอยู่ใน **บัญชี Cloudflare `64b63ea2…`** — บัญชีเดียวกับ tunnel `cloudflared`
(`ed36e902…`) และ `cloudflared-office` (`3632ace6…`) ที่รันบน .4 อยู่แล้ว
เดิมชี้ไป tunnel `bc1b056d…` ที่รันบน Mac mini

1. เพิ่ม Public Hostname `l2.workproth.com` → `http://localhost:8000` บน tunnel `ed36e902…`
2. สลับ CNAME `l2.workproth.com` → `ed36e902-175e-485c-9475-1614e8450b01.cfargotunnel.com`
3. ตรวจ `curl -s https://l2.workproth.com/api/status` — ต้องเห็น `"storage_dir":"/data"`
   (ถ้ายังเห็น `/Volumes/LABJRP2001/...` = ยังวิ่งเข้า Mac mini อยู่)
4. ลบ route เดิมออกจาก tunnel `bc1b056d…` แล้วค่อยหยุด pm2 + cloudflared บน Mac mini

**อย่า** ย้ายด้วยการเอา token `bc1b056d…` มารันบน .4 — tunnel ตัวนั้นอาจถือ hostname อื่น
ของ Mac mini อยู่ด้วย (เช่น Nextcloud `:7737`) จะพากันล่ม
