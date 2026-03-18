#!/bin/bash
echo "🚀 Booting ML Pipeline..."

# Activate the virtual environment
source .venv/bin/activate

# Optional: Auto-install missing packages if you have a requirements.txt
pip install -r requirements.txt

# Run the script
python ml_server.py

echo "✅ Done!"