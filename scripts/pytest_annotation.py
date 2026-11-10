#!/usr/bin/env python3
"""Show the result of pytest as an annotation of the GitHub workflow run.

Usage: python3 scripts/pytest_annotation.py pytest.log <notice|error>

The job log is not always reachable, the annotation is: a notice with the list of tests
when they passed, an error with the end of the log when they failed.
"""

import sys
from pathlib import Path

MAX_LENGTH = 8000


def main() -> None:
    log, level = Path(sys.argv[1]).read_text(encoding="utf-8"), sys.argv[2]
    if level == "error":
        text = log[-MAX_LENGTH:]
    else:
        text = "\n".join(line for line in log.splitlines() if " PASSED" in line or " FAILED" in line or "passed" in line)
    escaped = text.replace("%", "%25").replace("\r", "").replace("\n", "%0A")
    print(f"::{level} title=pytest::{escaped}")


if __name__ == "__main__":
    main()
