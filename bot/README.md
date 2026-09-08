# RM bot (VPS)

## 1. Install
```bash
cd bot
python3 -m pip install -r requirements.txt
cp .env.example .env
```

## 2. Configure
Open `.env` and fill in:
- `DISCORD_BOT_TOKEN` — from the Discord Developer Portal (Bot → Reset Token)
- `BOT_SYNC_KEY` — the same value saved as the `BOT_SYNC_KEY` secret on the dashboard
- `DASHBOARD_URL` — your published dashboard address

Enable **Message Content**, **Server Members** and **Presence** intents in the
Developer Portal, and upload `public/bot-icon.png` as the bot avatar.

## 3. Run
```bash
python3 bot.py
```

Keep it alive with systemd:
```ini
[Unit]
Description=RM Discord bot
After=network.target

[Service]
WorkingDirectory=/root/rm/bot
ExecStart=/usr/bin/python3 /root/rm/bot/bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## What it syncs
Every 60 seconds the bot pushes status + server list to the dashboard, pulls
per-server settings, and records every moderation case and command use.
