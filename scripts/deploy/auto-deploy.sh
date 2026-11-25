#!/bin/bash
# Deploy heirloomapp.io when the website's main, or the app data its rebuilt
# pages are built from, has changed (README.md, "How the site is built and
# deployed"). Run by launchd every 15 minutes (install-auto-deploy.sh).
#
# Each run: fetch; move a kept checkout to origin/main; sync the app's tables
# into site/src/data from the app at origin/main; and if the commit or the
# synced data differ from what was last deployed, build, run the copy check,
# upload the build as a new version that takes no traffic, smoke-test it at
# its own preview address, and only then send heirloomapp.io to it. Any step
# that fails leaves the live site on the version it had, and puts up a
# notification. Offline, a run says so and stops.
set -uo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin

SITE="${HEIRLOOM_SITE_REPO:-$HOME/Apps/Heirloom - Website}"
APP="${HEIRLOOM_APP_REPO:-$HOME/Apps/Heirloom}"
KEPT="$SITE/.claude/worktrees/_keep/site-deployer"
STATE_DIR="$HOME/Library/Application Support/Heirloom"
STATE="$STATE_DIR/site-deploy.state"
LOGS="$HOME/Library/Logs/Heirloom"
LOG="$LOGS/site-deploy.log"
LOCK="${TMPDIR:-/tmp}/heirloom-site-deploy.lock"

mkdir -p "$LOGS" "$STATE_DIR"
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 4000 ]; then tail -n 3000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi
exec >>"$LOG" 2>&1
echo "== $(date '+%Y-%m-%d %H:%M:%S')"

notify() { /usr/bin/osascript -e "display notification \"$1\" with title \"heirloomapp.io\"" >/dev/null 2>&1 || true; }
fail() { echo "FAILED: $1; the live site is unchanged"; notify "Not deployed: $1. The live site is unchanged. See ~/Library/Logs/Heirloom/site-deploy.log"; exit 1; }

if [ -d "$LOCK" ] && [ -n "$(find "$LOCK" -maxdepth 0 -mmin +45 2>/dev/null)" ]; then rmdir "$LOCK"; fi
if ! mkdir "$LOCK" 2>/dev/null; then echo "another run is deploying; skipped"; exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if ! git -C "$SITE" fetch -q origin main || ! git -C "$APP" fetch -q origin main; then echo "could not fetch (offline?); skipped"; exit 0; fi
if [ ! -d "$KEPT" ]; then git -C "$SITE" worktree add -q --detach "$KEPT" origin/main || fail "the deploy checkout could not be made"; fi
git -C "$KEPT" checkout -q --detach --force origin/main || fail "the deploy checkout could not be updated"
git -C "$KEPT" clean -q -fd -- site/src/data || true
cd "$KEPT" || fail "no deploy checkout"
COMMIT=$(git rev-parse --short=8 HEAD)

# The rebuilt pages' facts, from the app's main (not committed here: derived data).
APP_REPO="$APP" APP_REF=origin/main node site/scripts/sync-data.mjs >/dev/null || fail "the app's tables could not be synced"
DATA=$(find site/src/data -type f ! -name SOURCE.json -print0 | sort -z | xargs -0 shasum | shasum | cut -c1-16)
WANT="$COMMIT $DATA"
LAST=$(cut -d' ' -f1,2 "$STATE" 2>/dev/null || true)
PREV_PAGES=$(cut -d' ' -f3 "$STATE" 2>/dev/null || true)
if [ "$LAST" = "$WANT" ]; then echo "live is website $COMMIT with data $DATA: nothing to deploy"; exit 0; fi
echo "deploying website $COMMIT, data $DATA (last: $(cat "$STATE" 2>/dev/null || echo none))"

# Dependencies only when the lock file changed.
LOCKHASH=$(shasum site/package-lock.json | cut -c1-16)
if [ ! -d site/node_modules ] || [ "$(cat site/node_modules/.lockhash 2>/dev/null)" != "$LOCKHASH" ]; then
  (cd site && npm ci --no-audit --no-fund >/dev/null) || fail "npm ci failed"
  echo "$LOCKHASH" > site/node_modules/.lockhash
fi

# The copy check, as the old CI ran it (with the app's legal texts from its main).
LEGAL_DIR="$APP/.claude/worktrees/_keep/reference-publisher/legal" node scripts/check-copy.mjs >/dev/null 2>"$LOGS/site-deploy.copy-check.txt" \
  || { cat "$LOGS/site-deploy.copy-check.txt"; fail "the copy check failed on main ($COMMIT)"; }

(cd site && npm run build >/dev/null 2>&1) || fail "the build failed ($COMMIT)"
for f in index.html 404.html marks/index.html marks/london-date-letters.html sitemap.xml robots.txt _headers; do
  [ -s "site/dist/$f" ] || fail "the build has no $f"
done
grep -q "X-Robots-Tag: noindex" site/dist/_headers && fail "the build carries noindex (a review build)"
# A build that lost more than a tenth of its pages since the last deploy is a mistake until a person says otherwise.
PAGES=$(find site/dist -name '*.html' | wc -l | tr -d ' ')
if [ -n "$PREV_PAGES" ] && [ "$PAGES" -lt $(( PREV_PAGES * 9 / 10 )) ]; then fail "the build has $PAGES pages, $PREV_PAGES at the last deploy"; fi

# A new version that takes no traffic, tried at its own address first.
WR=site/node_modules/.bin/wrangler
OUT=$($WR versions upload --config wrangler.jsonc --message "auto-deploy $COMMIT" 2>&1) || { echo "$OUT" | tail -5; fail "the upload failed"; }
VERSION=$(echo "$OUT" | sed -n 's/.*Worker Version ID: \([0-9a-f-]*\).*/\1/p' | head -1)
PREVIEW=$(echo "$OUT" | sed -n 's/.*Version Preview URL: \(https[^ ]*\).*/\1/p' | head -1)
[ -n "$VERSION" ] && [ -n "$PREVIEW" ] || { echo "$OUT" | tail -5; fail "the upload named no version"; }
for p in / /marks/ /marks/london-date-letters /marks/chenghua-mark /guides /privacy /sitemap.xml; do
  code=$(curl -s -o /dev/null -m 30 -w '%{http_code}' "$PREVIEW$p")
  [ "$code" = 200 ] || fail "version $VERSION answers $code at $p"
done
[ "$(curl -s -o /dev/null -m 30 -w '%{http_code}' "$PREVIEW/no-such-page")" = 404 ] || fail "version $VERSION does not answer 404 for a missing page"

$WR versions deploy "$VERSION@100" --config wrangler.jsonc -y --message "auto-deploy $COMMIT" >/dev/null 2>&1 || fail "the switch to version $VERSION failed"
echo "$WANT $PAGES" > "$STATE"
echo "live: version $VERSION (website $COMMIT, data $DATA, $PAGES pages)"
