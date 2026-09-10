"""RM VPS bootstrap.

Loads the unchanged RM 2.0.0 bot implementation from a pinned commit while
forcing the production Vercel dashboard bridge. The VPS must provide the same
BOT_SYNC_KEY configured on Vercel; the Discord bot token is never used as a
replacement for the dashboard key.
"""

import os
import urllib.request

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

DASHBOARD_URL = "https://rmxyz.vercel.app"
PINNED_BOT_URL = (
    "https://raw.githubusercontent.com/itzmnyzzzXD/rmxyz/"
    "50462518c1ee97db687e92562641a02413c402d1/bot/bot.py"
)

bot_token = os.environ.get("DISCORD_BOT_TOKEN", "").strip()
if not bot_token or bot_token == "PUT_YOUR_BOT_TOKEN_HERE":
    raise SystemExit("Set DISCORD_BOT_TOKEN in the VPS environment before starting RM.")

sync_key = os.environ.get("BOT_SYNC_KEY", "").strip()
if not sync_key or sync_key == "PUT_YOUR_SYNC_KEY_HERE":
    raise SystemExit("Set BOT_SYNC_KEY in the VPS environment before starting RM.")

# Force the production dashboard URL, while preserving the shared secret from
# the VPS environment. The pinned core calls load_dotenv() without override=True,
# so these values remain authoritative for its dashboard bridge.
os.environ["DASHBOARD_URL"] = DASHBOARD_URL
os.environ["BOT_SYNC_KEY"] = sync_key

code = urllib.request.urlopen(PINNED_BOT_URL, timeout=20).read()
exec(compile(code, "rm_bot_core.py", "exec"), globals(), globals())
