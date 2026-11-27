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

# launchd runs this file from inside the deploy checkout, which each run moves
# to origin/main. Bash reads a script as it goes, so a run that pulls a new
# version of this file would go on reading the new bytes. Run from a copy.
if [ -z "${HEIRLOOM_DEPLOY_COPY:-}" ]; then
  COPY="${TMPDIR:-/tmp}/heirloom-site-deploy.$$.sh"
  cp "$0" "$COPY" && HEIRLOOM_DEPLOY_COPY="$COPY" exec /bin/bash "$COPY" "$@"
  echo "could not copy $0; running it in place" >&2
fi
[ -n "${HEIRLOOM_DEPLOY_COPY:-}" ] && trap 'rm -f "$HEIRLOOM_DEPLOY_COPY"' EXIT

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

# One run at a time. The lock holds the number of the run that took it and is
# taken back only once that run is gone, however long a build under load
# takes. (An age limit of 45 minutes let a second run start in this same
# checkout on 2026-11-26; the older build finished last and put the live site
# back behind a newer one.) A run still going after two hours puts up one
# notification, so a hung run is seen rather than overtaken.
lock_holder() { cat "$LOCK/pid" 2>/dev/null; }
lock_alive() {
  local pid; pid=$(lock_holder)
  # No number yet: a run between taking the lock and writing it, or a lock from
  # before the number was kept. Held for three hours, as no run takes longer.
  if [ -z "$pid" ]; then [ -z "$(find "$LOCK" -maxdepth 0 -mmin +180 2>/dev/null)" ]; return; fi
  kill -0 "$pid" 2>/dev/null && ps -p "$pid" -o command= 2>/dev/null | grep -q -e 'heirloom-site-deploy' -e 'auto-deploy\.sh'
}
take_lock() {
  if mkdir "$LOCK" 2>/dev/null; then echo $$ > "$LOCK/pid"; return 0; fi
  lock_alive && return 1
  echo "the lock of run $(lock_holder || true) was left behind; taken back"
  rm -rf "$LOCK"
  mkdir "$LOCK" 2>/dev/null && echo $$ > "$LOCK/pid"
}
release_lock() { [ "$(lock_holder)" = "$$" ] && rm -rf "$LOCK"; return 0; }
if ! take_lock; then
  HOLDER=$(lock_holder)
  echo "another run${HOLDER:+ (pid $HOLDER)} is deploying; skipped"
  if [ -n "$(find "$LOCK/pid" -maxdepth 0 -mmin +120 2>/dev/null)" ] && mkdir "$LOCK/warned" 2>/dev/null; then
    notify "A deploy has been running for over two hours (pid $HOLDER). See ~/Library/Logs/Heirloom/site-deploy.log"
  fi
  exit 0
fi
trap 'release_lock; [ -n "${HEIRLOOM_DEPLOY_COPY:-}" ] && rm -f "$HEIRLOOM_DEPLOY_COPY"' EXIT

if ! git -C "$SITE" fetch -q origin main || ! git -C "$APP" fetch -q origin main; then echo "could not fetch (offline?); skipped"; exit 0; fi
if [ ! -d "$KEPT" ]; then git -C "$SITE" worktree add -q --detach "$KEPT" origin/main || fail "the deploy checkout could not be made"; fi
git -C "$KEPT" checkout -q --detach --force origin/main || fail "the deploy checkout could not be updated"
git -C "$KEPT" clean -q -fd -- site/src/data || true
cd "$KEPT" || fail "no deploy checkout"
COMMIT=$(git rev-parse --short=8 HEAD)

# The rebuilt pages' facts, from the app's main (not committed here: derived data).
APP_REPO="$APP" APP_REF=origin/main node site/scripts/sync-data.mjs >/dev/null || fail "the app's tables could not be synced"
APP_COMMIT=$(node -p "require('./site/src/data/app/SOURCE.json').commit" 2>/dev/null || true)
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

(cd site && npm run build >/dev/null 2>&1) || fail "the build failed ($COMMIT)"
for f in index.html 404.html marks/index.html marks/london-date-letters.html sitemap.xml robots.txt _headers; do
  [ -s "site/dist/$f" ] || fail "the build has no $f"
done

# The copy check, as the old CI ran it (with the app's legal texts from its
# main), on the home page the build will serve: the built site/dist/index.html,
# whether it is the carried-over root page or the site's own.
COPY_CHECK_INDEX="$KEPT/site/dist/index.html" LEGAL_DIR="$APP/.claude/worktrees/_keep/reference-publisher/legal" node scripts/check-copy.mjs >/dev/null 2>"$LOGS/site-deploy.copy-check.txt" \
  || { cat "$LOGS/site-deploy.copy-check.txt"; fail "the copy check failed on main ($COMMIT)"; }
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

# Never switch back past what is live. The state file names the website and
# app commits of the last deploy; if either is newer than this build's (a
# person deployed, or another run got there first), this build stays unused.
newer_live() {  # newer_live <state> <site repo> <website commit> <app repo> <app commit>
  [ -f "$1" ] || return 1
  local live_site live_app
  read -r live_site _ _ live_app < "$1"
  if [ -n "$live_site" ] && [ "$live_site" != "$3" ] && git -C "$2" merge-base --is-ancestor "$3" "$live_site" 2>/dev/null; then echo "website $live_site"; return 0; fi
  if [ -n "${live_app:-}" ] && [ -n "$5" ] && [ "$live_app" != "$5" ] && git -C "$4" merge-base --is-ancestor "$5" "$live_app" 2>/dev/null; then echo "app data $live_app"; return 0; fi
  return 1
}
if NEWER=$(newer_live "$STATE" "$KEPT" "$COMMIT" "$APP" "$APP_COMMIT"); then
  echo "not switched: $NEWER is already live, newer than this build (website $COMMIT, app $APP_COMMIT); version $VERSION left unused"
  exit 0
fi
$WR versions deploy "$VERSION@100" --config wrangler.jsonc -y --message "auto-deploy $COMMIT" >/dev/null 2>&1 || fail "the switch to version $VERSION failed"
echo "$WANT $PAGES $APP_COMMIT" > "$STATE"
echo "live: version $VERSION (website $COMMIT, data $DATA, $PAGES pages)"
