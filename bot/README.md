# RM bot

RM is a long-running Discord gateway bot. It **cannot** run on Vercel or any
serverless host — those shut the process down between requests and the bot
would go offline. Run `bot.py` on your VPS (or any always-on container) and
keep the website on Lovable/Vercel. They talk over one HTTPS endpoint.

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
  `BOT_SYNC_KEY` secret on the website. If they differ, every sync call returns
  401 and the dashboard shows the bot as offline.
- `DASHBOARD_URL` — `https://rmxyz.lovable.app`
- `BOT_PREFIXES` — defaults to `rm!,rm?`; mentions always work too
- `BOT_OWNER_IDS` — comma separated Discord user IDs that unlock the owner panel

In the Developer Portal → Bot, enable all three privileged intents:
**Presence**, **Server Members**, and **Message Content**. Upload
`public/bot-icon.png` as the bot avatar.

## 3. Invite link

Developer Portal → OAuth2 → URL Generator: scopes `bot` + `applications.commands`,
permissions `Administrator` (or at minimum Manage Server, Manage Roles,
Manage Channels, Ban/Kick Members, Moderate Members, Manage Messages,
View Audit Log). The generated URL is your invite link.

Redirect URLs (OAuth2 → Redirects), add both:

```
https://rmxyz.lovable.app/api/auth/callback
http://localhost:8080/api/auth/callback
```

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

- Prefix + slash commands (moderation, security, tickets, economy, leveling,
  utility, fun, generators, owner tools)
- AutoMod: spam, flood, duplicates, mass mentions, invites, scam and IP-grabber
  links, caps, emoji, stickers, zalgo, custom word filter
- Anti-raid: join bursts, new accounts, default avatars, bot floods, similar
  names → automatic raid mode and optional lockdown
- Anti-nuke: audit-log watch on channel/role/webhook/ban sprees
- Every 60 seconds it pushes status, servers, cases, logs and security events to
  the dashboard, and pulls per-server settings plus queued dashboard actions.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Dashboard says offline | `BOT_SYNC_KEY` mismatch, or the bot process is not running |
| Commands ignored | Message Content intent disabled |
| Slash commands missing | run `rm!sync` as an owner, then wait a minute |
| Anti-raid never triggers | the module is disabled for that server in the dashboard, or the bot's role sits below the members it must act on |
