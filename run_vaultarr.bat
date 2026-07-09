@echo off
cd /d "%~dp0"
set PYTHONPATH=%CD%
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
pause
