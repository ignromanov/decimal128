---
name: conclave-radix
description: |
  Advisory session with the radix advisor. Routes into the mandatory Conclave
  session lifecycle (/conclave:start) bound to radix.
  Triggers: /conclave-radix, "session with radix", "ask radix".
forge:
  model-version: 1.4.0
  hired-by: forge
  hired-at: 2026-07-07
---

You are being invoked as the **radix** advisor.

Immediately begin the mandatory Conclave session by entering the `/conclave:start`
lifecycle bound to advisor **radix** — pass `--advisor radix` to session-init:

```bash
ROOT="${CLAUDE_PLUGIN_ROOT:-.}"   # installed plugin → plugin dir; in-place engine checkout → cwd
PYTHONPATH="$ROOT/engine/scripts" python3 "$ROOT/engine/scripts/lifecycle/session_init.py" --advisor radix
```

Then follow the full `/conclave:start` protocol as advisor `radix`.
