import json
from pathlib import Path

config_path = Path(__file__).parent / "indicators_v0.json"

with config_path.open("r", encoding="utf-8") as f:
    indicators = json.load(f)

print("✅ Indicateurs V0 chargés :")
for i, ind in enumerate(indicators, start=1):
    print(f"{i}. {ind['code']} - {ind['name']}")
