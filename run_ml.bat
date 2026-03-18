@echo off
echo 🚀 Booting ML Pipeline...

:: 1. Check if the virtual environment exists. If not, create it!
IF NOT EXIST ".venv" (
    echo 📦 Virtual environment not found. Creating one now. This takes a few seconds...
    python -m venv .venv
)

:: 2. Activate the virtual environment
call .venv\Scripts\activate

:: 3. Install or update missing packages
echo 📥 Checking requirements...
pip install -r requirements.txt

:: 4. Run the microservice
echo 🧠 Starting ML Server...
python ml_server.py

echo ✅ Done!
pause