#!/usr/bin/env python3
"""Set the version of the integration (manifest.json is the only place where it is set).

Usage: python3 scripts/bump_version.py 0.2.0          (release)
       python3 scripts/bump_version.py 0.2.0-beta.1   (pre-release / test build)

Home Assistant reads the version from the manifest; the card gets it as ?v= of its address.
"""

import json
import re
import sys
from pathlib import Path

MANIFEST = Path(__file__).resolve().parent.parent / "custom_components" / "essential_budget" / "manifest.json"
SEMVER = re.compile(r"^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$")


def main() -> None:
    if len(sys.argv) != 2 or not SEMVER.match(sys.argv[1]):
        sys.exit(__doc__)
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    data["version"] = sys.argv[1]
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Version set to {sys.argv[1]}")


if __name__ == "__main__":
    main()
