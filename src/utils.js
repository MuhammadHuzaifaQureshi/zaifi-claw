// ⚡ Zaifi Claw — Terminal Utilities (Colors, Spinner, Formatting)

// --- ANSI Color Codes ---
export const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    italic: '\x1b[3m',
    underline: '\x1b[4m',

    // Theme colors
    accent: '\x1b[38;2;204;255;51m',      // #CCFF33
    accentBg: '\x1b[48;2;204;255;51m',     // #CCFF33 background
    black: '\x1b[38;2;10;10;10m',          // #0A0A0A
    white: '\x1b[37m',
    gray: '\x1b[90m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',

    // Semantic
    error: '\x1b[31m✖\x1b[0m',
    warn: '\x1b[33m⚠\x1b[0m',
    success: '\x1b[32m✔\x1b[0m',
    info: '\x1b[36mℹ\x1b[0m',
};

// --- Banner ---
export function banner() {
    console.log(`
${c.accent}  ╔══════════════════════════════════════╗
  ║                                      ║
  ║   ⚡  Z A I F I  C L A W   v1.0     ║
  ║      AI Coding Assistant             ║
  ║                                      ║
  ╚══════════════════════════════════════╝${c.reset}
${c.dim}  Type ${c.accent}/help${c.dim} for commands • ${c.accent}/exit${c.dim} to quit${c.reset}
`);
}

// --- Spinner ---
export class Spinner {
    constructor(text = 'Thinking') {
        this.text = text;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.i = 0;
        this.interval = null;
    }

    start() {
        this.interval = setInterval(() => {
            process.stdout.write(`\r${c.accent}${this.frames[this.i]}${c.reset} ${c.dim}${this.text}...${c.reset}`);
            this.i = (this.i + 1) % this.frames.length;
        }, 80);
    }

    stop(finalText) {
        clearInterval(this.interval);
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        if (finalText) {
            console.log(finalText);
        }
    }
}

// --- Format AI Response for Terminal ---
export function formatResponse(text) {
    if (!text) return '';

    let result = text;

    // Bold: **text** → accent color
    result = result.replace(/\*\*(.*?)\*\*/g, `${c.accent}$1${c.reset}`);

    // Inline code: `code` → highlighted
    result = result.replace(/`([^`\n]+)`/g, `${c.accentBg}${c.black} $1 ${c.reset}`);

    // Code blocks: ```lang\ncode\n```
    result = result.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const header = lang ? `${c.dim}─── ${lang} ───${c.reset}\n` : `${c.dim}─── code ───${c.reset}\n`;
        const formattedCode = code.split('\n').map(line => `${c.gray}│${c.reset} ${line}`).join('\n');
        return `\n${header}${formattedCode}\n${c.dim}────────────${c.reset}`;
    });

    // Headers: # text → accent + bold
    result = result.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, text) => {
        return `\n${c.accent}${c.bold}${text}${c.reset}`;
    });

    // Bullet points
    result = result.replace(/^[-*]\s+/gm, `${c.accent}  ▸ ${c.reset}`);

    // Numbered lists
    result = result.replace(/^(\d+)\.\s+/gm, `${c.accent}  $1. ${c.reset}`);

    return result;
}

// --- Divider ---
export function divider() {
    const width = Math.min(process.stdout.columns || 60, 60);
    console.log(`${c.dim}${'─'.repeat(width)}${c.reset}`);
}

// --- Timestamp ---
export function timestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
