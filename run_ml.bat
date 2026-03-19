@echo off
echo 🚀 Booting ML Pipeline...

IF NOT EXIST ".venv" (
    echo 📦 Virtual environment not found. Creating one now. This takes a few seconds...
    python -m venv .venv
)

call .venv\Scripts\activate

echo 📥 Checking requirements...
pip install -r requirements.txt

echo 🧠 Starting ML Server...
python ml_server.py

echo ✅ Done!
pause