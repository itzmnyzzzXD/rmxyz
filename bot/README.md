# RM bot

RM is a long-running Discord gateway bot. It **cannot** run on Vercel or any
serverless host — those shut the process down between requests and the bot
would go offline. Run `bot.py` on your VPS (or any always-on container) and
keep the website on Vercel. They communicate through one HTTPS endpoint.

## 1. Install

```bash
cd bot
python3 -m pip install -r requirements.txt
cp .env.example .env
```

## 2. Configure

Open `.env` and fill in:

- `DISCORD_BOT_TOKEN` — Discord Developer Portal → your app → Bot → Reset Token
- `BOT_SYNC_KEY` — must be **exactly** the same value that is stored as the
  `BOT_SYNC_KEY` secret on the Vercel project. If they differ, sync calls return
  401 and the dashboard shows the bot as offline.
- `DASHBOARD_URL` — `https://rmxyz.vercel.app`
- `BOT_PREFIXES` — defaults to `rm!,rm?`; mentions always work too
- `BOT_OWNER_IDS` — comma separated Discord user IDs that unlock owner tools

In the Developer Portal → Bot, enable all three privileged intents:
**Presence**, **Server Members**, and **Message Content**. Upload
`public/bot-icon.png` as the bot avatar.

## 3. Invite link

Developer Portal → OAuth2 → URL Generator: scopes `bot` + `applications.commands`,
permissions `Administrator` (or the minimum permissions your modules need).

For the current local-auth deployment there is no Discord OAuth callback required
for dashboard login. New users start from `rm!verify` / `rm?verify` in Discord.

## 4. Run

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
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## What it does

- Prefix + slash commands across moderation, security, tickets, economy,
  leveling, utility, fun, generators, links and owner tools
- AutoMod for spam, flooding, duplicates, mass mentions, invites, scam and
  IP-grabber links, caps, emoji, stickers, zalgo and custom filters
- Anti-raid for join bursts, suspicious accounts, bot floods and similar-name raids
- Anti-nuke audit-log monitoring for channel, role, webhook and ban sprees
- Periodic HTTPS sync of bot status, guilds, moderation cases, logs, security
  events and queued dashboard actions

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Dashboard says offline | `BOT_SYNC_KEY` mismatch, wrong `DASHBOARD_URL`, or bot process stopped |
| Commands ignored | Message Content intent disabled |
| Slash commands missing | run `rm!sync` as an owner, then wait for Discord to propagate |
| Verify link fails | check that `BOT_SYNC_KEY` matches the Vercel project and the website is reachable |
| Anti-raid never triggers | module disabled for the server, or the bot role is below the members it must act on |
