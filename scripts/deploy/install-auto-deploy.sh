#!/bin/bash
# Install (or remove, with --remove) the launchd job that runs auto-deploy.sh
# every 15 minutes for this Mac's user.
set -euo pipefail
LABEL=com.heirloom.site-deploy
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SITE="${HEIRLOOM_SITE_REPO:-$HOME/Apps/Heirloom - Website}"
KEPT="$SITE/.claude/worktrees/_keep/site-deployer"

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
if [ "${1:-}" = "--remove" ]; then rm -f "$PLIST"; echo "removed $LABEL"; exit 0; fi

git -C "$SITE" fetch -q origin main
[ -d "$KEPT" ] || git -C "$SITE" worktree add -q --detach "$KEPT" origin/main
git -C "$KEPT" checkout -q --detach --force origin/main

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$KEPT/scripts/deploy/auto-deploy.sh</string></array>
  <key>StartInterval</key><integer>900</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>LowPriorityIO</key><true/>
  <key>Nice</key><integer>10</integer>
</dict>
</plist>
PLIST
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "installed $LABEL: every 15 minutes; log ~/Library/Logs/Heirloom/site-deploy.log"
