from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
rules = json.loads((root / "shared/fireflies.json").read_text(encoding="utf-8"))
header = "#pragma once\n// Generated from shared/fireflies.json.\nnamespace Fireflies {\n"
for key, value in rules.items():
    if type(value) is not int or value < 1:
        raise ValueError(f"Expected a positive integer for {key}")
    header += f"constexpr int {key} = {value};\n"
header += "}\n"
sketch = root / "CrowPanel/PonyGotchi_Studio_CrowPanel"
(sketch / "fireflies_rules.h").write_text(header, encoding="ascii", newline="\n")
