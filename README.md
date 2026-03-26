# ⚡ Zaifi Claw

> Minimal AI Coding Assistant — Like NanoClaw, but yours.

## 🌟 Features

- 💬 AI chat in terminal — powered by Gemini (FREE)
- 📂 Read & write files in your project
- ⚡ Execute shell commands
- 🔍 Search across your codebase
- 🌐 Web dashboard (`zaificlaw --ui`)
- 📱 Telegram bot integration
- 🔒 100% private — keys stored locally
- 💰 $0/month — uses Gemini free tier

## 🚀 Quick Start

```bash
# Install
npm install -g zaificlaw

# Setup (add Gemini API key)
zaificlaw --setup

# Start coding
cd my-project
zaificlaw
```

## 📸 Commands

| Command | Description |
|---------|-------------|
| `zaificlaw` | Interactive AI chat |
| `zaificlaw "prompt"` | Single question |
| `zaificlaw --ui` | Open web dashboard |
| `zaificlaw --setup` | Configure API keys |
| `zaificlaw --help` | Show help |

## 🎮 Chat Commands

| Command | Description |
|---------|-------------|
| `/help` | Show commands |
| `/files` | List project files |
| `/read <file>` | Read a file |
| `/search <query>` | Search in files |
| `/run <cmd>` | Execute command |
| `/info` | Project info |
| `/clear` | Clear history |
| `/exit` | Exit |

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **AI:** Google Gemini API (FREE)
- **Dashboard:** Built-in HTTP server
- **Dependencies:** Zero (uses Node.js built-ins)
- **Website:** Vercel (FREE)

## 📁 Structure

```
zaifi-claw/
├── bin/zaificlaw.js     # CLI entry point
├── src/
│   ├── cli.js           # Interactive terminal
│   ├── ai.js            # Gemini/Claude API
│   ├── tools.js         # File I/O, exec, search
│   ├── config.js        # Settings manager
│   ├── server.js        # Dashboard server
│   └── utils.js         # Colors, formatting
├── dashboard/           # Web dashboard
└── website/             # Landing page
```

## 🔒 Security

- API keys stored in `~/.zaificlaw/config.json`
- Never transmitted except to AI API
- No telemetry, no tracking
- File access limited to CWD

## 📄 License

MIT

---

**Made with ⚡ by [Muhammad Huzaifa Qureshi](https://github.com/MuhammadHuzaifaQureshi) — for PIAIC/Panaversity**
