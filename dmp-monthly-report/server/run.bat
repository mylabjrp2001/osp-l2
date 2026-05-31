@echo off
REM Run the DMP Monthly Report backend on Windows.
REM Usage: double-click, or `server\run.bat` from project root.

cd /d %~dp0\..

if not exist server\.venv (
  echo Creating virtualenv...
  python -m venv server\.venv
  call server\.venv\Scripts\activate
  pip install --upgrade pip
  pip install -r server\requirements.txt
) else (
  call server\.venv\Scripts\activate
)

set DMP_STORAGE=%~dp0storage
echo Storage dir : %DMP_STORAGE%
echo Open in LAN : http://%COMPUTERNAME%:8000

python -m uvicorn server.app:app --host 0.0.0.0 --port 8000
