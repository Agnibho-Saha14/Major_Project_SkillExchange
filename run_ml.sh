#!/bin/bash

echo "🚀 Booting ML Pipeline..."

if [ ! -d ".venv" ]; then
    echo "📦 Virtual environment not found. Creating one now. This takes a few seconds..."
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "📥 Checking requirements..."
pip install -r requirements.txt

echo "🧠 Starting ML Server..."
python3 ml_server.py

echo "✅ Done!"
read -n 1 -s -r -p "Press any key to continue..."
echo ""