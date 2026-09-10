"""RM VPS bootstrap.

Loads the unchanged RM 2.0.0 bot implementation from a pinned commit while
forcing the production Vercel dashboard bridge. This keeps the VPS launcher
stable and prevents an old Lovable URL/key from being used by the bot.
"""

import hashlib
import os
import urllib.request

DASHBOARD_URL = "https://rmxyz.vercel.app"
PINNED_BOT_URL = (
    "https://raw.githubusercontent.com/itzmnyzzzXD/rmxyz/"
    "50462518c1ee97db687e92562641a02413c402d1/bot/bot.py"
)

bot_token = os.environ.get("DISCORD_BOT_TOKEN", "")
if not bot_token or bot_token == "PUT_YOUR_BOT_TOKEN_HERE":
    raise SystemExit("Set DISCORD_BOT_TOKEN in the VPS environment before starting RM.")

# Always force the production bridge. The pinned core calls load_dotenv()
# without override=True, so these environment values remain authoritative.
os.environ["DASHBOARD_URL"] = DASHBOARD_URL
# Use a deterministic bridge proof derived from the bot token. The Vercel
# endpoint verifies the same SHA-256 value, so no second secret is required.
os.environ["BOT_SYNC_KEY"] = hashlib.sha256(bot_token.encode("utf-8")).hexdigest()

code = urllib.request.urlopen(PINNED_BOT_URL, timeout=20).read()
exec(compile(code, "rm_bot_core.py", "exec"), globals(), globals())
