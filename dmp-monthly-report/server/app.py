"""FastAPI backend for DMP Monthly Report.

Endpoints:
  GET  /api/status            current uploaded Excel files + data.json info
  POST /api/upload            multipart upload of one Data Job done YYYY.xls* file
                              → saves to storage/excel/ → rebuilds data.json
  DELETE /api/files/{name}    remove an uploaded Excel (year) and rebuild
  GET  /data.json             current built dataset (also served as static)

In production also serves the Vite `dist/` build at `/`.

Run (dev):
    uvicorn server.app:app --reload --port 8000
Run (prod, Windows VPS):
    uvicorn server.app:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import json
import os
import shutil
import sys
import threading
import traceback
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from server.etl import (
    build_data_json,
    list_excel_files,
    parse_year_from_filename,
)


ROOT = Path(__file__).resolve().parents[1]            # dmp-monthly-report/
STORAGE = Path(os.environ.get("DMP_STORAGE", ROOT / "server" / "storage"))
EXCEL_DIR = STORAGE / "excel"
DATA_JSON = STORAGE / "data.json"
DIST_DIR = ROOT / "dist"

EXCEL_DIR.mkdir(parents=True, exist_ok=True)
STORAGE.mkdir(parents=True, exist_ok=True)

# Rebuilds are serialized to avoid two uploads clobbering each other.
_BUILD_LOCK = threading.Lock()


app = FastAPI(title="DMP Monthly Report")

# CORS — needed for dev (Vite on :5173 hitting FastAPI on :8000 directly without proxy).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- helpers ----------

def _file_stat(p: Path) -> dict:
    st = p.stat()
    return {
        "name": p.name,
        "year": parse_year_from_filename(p.name),
        "size": st.st_size,
        "mtime": datetime.fromtimestamp(st.st_mtime).isoformat(timespec="seconds"),
    }


def _data_json_meta() -> dict | None:
    if not DATA_JSON.exists():
        return None
    try:
        with DATA_JSON.open("r", encoding="utf-8") as f:
            head = json.loads(f.read())
        return {
            "generated_at": head.get("generated_at"),
            "date_min": head.get("date_min"),
            "date_max": head.get("date_max"),
            "total": head.get("total"),
            "size": DATA_JSON.stat().st_size,
        }
    except Exception:
        return None


def _status_payload() -> dict:
    files = [_file_stat(p) for p, _ in list_excel_files(EXCEL_DIR)]
    return {
        "files": files,
        "data": _data_json_meta(),
        "storage_dir": str(STORAGE),
    }


def _rebuild() -> dict:
    """Rebuild data.json from files in EXCEL_DIR. Caller must hold lock."""
    return build_data_json(EXCEL_DIR, DATA_JSON, log=lambda m: print(m, file=sys.stderr))


# ---------- API ----------

@app.get("/api/status")
def api_status():
    return _status_payload()


@app.post("/api/upload")
async def api_upload(file: UploadFile = File(...)):
    fname = (file.filename or "").strip()
    if not fname:
        raise HTTPException(400, "missing filename")
    year = parse_year_from_filename(fname)
    if year is None:
        raise HTTPException(
            400,
            f"filename must look like 'Data Job done <YEAR>.xlsx' or '.xlsm' (got: {fname!r})",
        )

    dst = EXCEL_DIR / fname
    tmp = dst.with_suffix(dst.suffix + ".uploading")
    try:
        with tmp.open("wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        tmp.replace(dst)
    except Exception as e:
        tmp.unlink(missing_ok=True)
        raise HTTPException(500, f"failed to save upload: {e}")

    # Remove other extensions for same year (e.g. uploading .xlsm to replace .xlsx)
    for other, oyear in list_excel_files(EXCEL_DIR):
        if oyear == year and other.name != dst.name:
            try:
                other.unlink()
            except OSError:
                pass

    with _BUILD_LOCK:
        try:
            info = _rebuild()
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(500, f"ETL failed: {e}")

    return {
        "ok": True,
        "saved": _file_stat(dst),
        "build": info,
        "status": _status_payload(),
    }


@app.delete("/api/files/{name}")
def api_delete(name: str):
    if "/" in name or "\\" in name or ".." in name:
        raise HTTPException(400, "invalid name")
    target = EXCEL_DIR / name
    if not target.exists():
        raise HTTPException(404, "file not found")
    target.unlink()
    with _BUILD_LOCK:
        if list_excel_files(EXCEL_DIR):
            try:
                _rebuild()
            except Exception as e:
                raise HTTPException(500, f"ETL failed: {e}")
        else:
            # No files left → remove built data.json too
            DATA_JSON.unlink(missing_ok=True)
    return {"ok": True, "status": _status_payload()}


@app.get("/data.json")
def data_json():
    if not DATA_JSON.exists():
        return JSONResponse(
            {
                "generated_at": None,
                "date_min": None,
                "date_max": None,
                "total": 0,
                "records": [],
                "empty": True,
            }
        )
    return FileResponse(
        DATA_JSON,
        media_type="application/json",
        headers={"Cache-Control": "no-store"},
    )


# ---------- Static frontend (production) ----------

if DIST_DIR.exists():
    # SPA fallback: anything not matched above is served from dist/index.html
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        # Prefer real file in dist/
        candidate = DIST_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST_DIR / "index.html")
else:

    @app.get("/")
    def root_no_dist():
        return {
            "ok": True,
            "msg": "Backend running. `npm run build` to enable static UI, or run Vite dev server.",
            "endpoints": ["/api/status", "/api/upload", "/data.json"],
        }
