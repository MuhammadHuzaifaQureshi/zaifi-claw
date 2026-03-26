//   Zaifi Claw — Config Manager
// Stores API keys in ~/.zaificlaw/config.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';
import { c } from './utils.js';

const CONFIG_DIR = join(homedir(), '.zaificlaw');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// --- Default Config ---
const DEFAULT_CONFIG = {
    geminiApiKey: '',
    claudeApiKey: '',
    telegramBotToken: '',
    model: 'gemini-2.0-flash',
    maxTokens: 2048,
    temperature: 0.7,
    dashboardPort: 3456
};

// --- Get Config ---
export function getConfig() {
    try {
        if (existsSync(CONFIG_FILE)) {
            const data = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
            return { ...DEFAULT_CONFIG, ...data };
        }
    } catch (e) { }
    return { ...DEFAULT_CONFIG };
}

// --- Save Config ---
export function saveConfig(config) {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// --- Update Single Key ---
export function updateConfig(key, value) {
    const config = getConfig();
    config[key] = value;
    saveConfig(config);
    return config;
}

// --- Interactive Setup ---
export async function setup() {
    const config = getConfig();
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const ask = (q) => new Promise(resolve => rl.question(q, resolve));

    console.log(`\n${c.accent}  Zaifi Claw Setup${c.reset}\n`);
    console.log(`${c.dim}Config will be saved to: ${CONFIG_FILE}${c.reset}\n`);

    // Gemini API Key
    console.log(`${c.accent}1.${c.reset} Google Gemini API Key ${c.dim}(FREE — get from aistudio.google.com)${c.reset}`);
    const geminiKey = await ask(`${c.accent}   API Key${c.reset} [${config.geminiApiKey ? '****' + config.geminiApiKey.slice(-4) : 'not set'}]: `);
    if (geminiKey.trim()) config.geminiApiKey = geminiKey.trim();

    // Telegram Bot Token (optional)
    console.log(`\n${c.accent}2.${c.reset} Telegram Bot Token ${c.dim}(optional — get from @BotFather)${c.reset}`);
    const telegramToken = await ask(`${c.accent}   Token${c.reset} [${config.telegramBotToken ? '****' + config.telegramBotToken.slice(-4) : 'not set'}]: `);
    if (telegramToken.trim()) config.telegramBotToken = telegramToken.trim();

    rl.close();

    saveConfig(config);
    console.log(`\n${c.success} Config saved to ${c.dim}${CONFIG_FILE}${c.reset}`);
    console.log(`${c.dim}Run ${c.accent}zaificlaw${c.dim} to start chatting!${c.reset}\n`);
}

// --- Get Config Path (for dashboard) ---
export function getConfigPath() {
    return CONFIG_FILE;
}
