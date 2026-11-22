"""Where the marks pages get their facts: the app's mark tables.

The pages under /marks/ are built from backend/src/data/mark-tables/*.json in
the app repository, the same tables Heirloom Advisor dates marks with, so the
site and the app always say the same thing.

By default the tables are read from the app's `main` branch with `git show`,
so the result doesn't depend on which branch the app checkout happens to be on
(Joe's checkout is often on a release branch that hasn't caught up).

    APP_REPO     the app repository (default: ../Heirloom beside this site)
    APP_REF      the branch or commit to read (default: origin/main, fetched first)
    MARK_TABLES  a folder of the JSON files instead; skips git entirely
"""
import json
import os
import subprocess

SITE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
APP_REPO = os.environ.get("APP_REPO") or os.path.abspath(os.path.join(SITE_ROOT, "..", "Heirloom"))
APP_REF = os.environ.get("APP_REF", "origin/main")
PREFIX = "backend/src/data/mark-tables"
_fetched = False


def _git(*args):
    return subprocess.run(["git", "-C", APP_REPO, *args], check=True, capture_output=True, text=True).stdout


def describe():
    """One line naming where the tables came from, for the build's output."""
    if os.environ.get("MARK_TABLES"):
        return f"mark tables from {os.environ['MARK_TABLES']}"
    sha = _git("rev-parse", "--short", APP_REF).strip()
    return f"mark tables from {APP_REPO} at {APP_REF} ({sha})"


def load(name):
    """One table, parsed: load('hallmarks') reads hallmarks.json."""
    global _fetched
    folder = os.environ.get("MARK_TABLES")
    if folder:
        with open(os.path.join(folder, f"{name}.json")) as f:
            return json.load(f)
    if not os.path.isdir(APP_REPO):
        raise SystemExit(f"The app repository isn't at {APP_REPO}. Set APP_REPO, or MARK_TABLES to a folder of the tables.")
    if APP_REF.startswith("origin/") and not _fetched:
        # Quietly bring the remote branch up to date; offline, use what's there.
        subprocess.run(["git", "-C", APP_REPO, "fetch", "-q", "origin", APP_REF.split("/", 1)[1]], capture_output=True)
        _fetched = True
    return json.loads(_git("show", f"{APP_REF}:{PREFIX}/{name}.json"))
