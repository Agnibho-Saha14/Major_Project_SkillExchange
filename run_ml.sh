#!/bin/bash

echo "🚀 Booting ML Pipeline..."

# 1. Check if the virtual environment directory exists. If not, create it!
if [ ! -d ".venv" ]; then
    echo "📦 Virtual environment not found. Creating one now. This takes a few seconds..."
    python3 -m venv .venv
fi

# 2. Activate the virtual environment
source .venv/bin/activate

# 3. Install or update missing packages
echo "📥 Checking requirements..."
pip install -r requirements.txt

# 4. Run the microservice
echo "🧠 Starting ML Server..."
python3 ml_server.py

echo "✅ Done!"
read -n 1 -s -r -p "Press any key to continue..."
echo ""