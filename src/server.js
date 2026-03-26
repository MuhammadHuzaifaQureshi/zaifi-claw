// ⚡ Zaifi Claw — Dashboard Web Server (opens on --ui)

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getConfig, saveConfig, getConfigPath } from './config.js';
import { getAIInfo } from './ai.js';
import { getProjectInfo } from './tools.js';
import { c } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DASHBOARD_DIR = join(__dirname, '..', 'dashboard');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};

// Track state
let startTime = Date.now();
let connectedBots = {
    telegram: { enabled: false, token: '', webhookUrl: '' }
};

export async function startDashboard() {
    const config = getConfig();
    const port = config.dashboardPort || 3456;

    // Update bot status from config
    if (config.telegramBotToken) {
        connectedBots.telegram.enabled = true;
        connectedBots.telegram.token = config.telegramBotToken;
    }

    const server = createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${port}`);

        // API Routes
        if (url.pathname.startsWith('/api/')) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            try {
                await handleAPI(url.pathname, req, res);
            } catch (e) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        // Serve static files from dashboard/
        let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
        const fullPath = join(DASHBOARD_DIR, filePath);

        if (!existsSync(fullPath)) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const ext = extname(fullPath);
        const contentType = MIME_TYPES[ext] || 'text/plain';

        try {
            const content = readFileSync(fullPath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } catch (e) {
            res.writeHead(500);
            res.end('Error reading file');
        }
    });

    server.listen(port, () => {
        console.log(`\n${c.accent}  ⚡ Dashboard running at:${c.reset}`);
        console.log(`${c.bold}  http://localhost:${port}${c.reset}\n`);
        console.log(`${c.dim}  Press Ctrl+C to stop${c.reset}\n`);

        // Try to open browser
        const { exec: execCmd } = await import('child_process');
        try {
            const cmd = process.platform === 'win32' ? 'start' :
                       process.platform === 'darwin' ? 'open' : 'xdg-open';
            execCmd(`${cmd} http://localhost:${port}`);
        } catch (e) {}
    });
}

// --- API Routes ---
async function handleAPI(pathname, req, res) {
    switch (pathname) {
        case '/api/status': {
            const config = getConfig();
            const ai = getAIInfo();
            const project = getProjectInfo();
            const uptime = Math.floor((Date.now() - startTime) / 1000);

            res.writeHead(200);
            res.end(JSON.stringify({
                status: 'connected',
                uptime,
                uptimeFormatted: formatUptime(uptime),
                ai,
                project,
                configPath: getConfigPath(),
                bots: connectedBots,
                version: '1.0.0'
            }));
            break;
        }

        case '/api/config': {
            if (req.method === 'GET') {
                const config = getConfig();
                // Mask sensitive keys
                res.writeHead(200);
                res.end(JSON.stringify({
                    geminiApiKey: config.geminiApiKey ? '****' + config.geminiApiKey.slice(-4) : '',
                    claudeApiKey: config.claudeApiKey ? '****' + config.claudeApiKey.slice(-4) : '',
                    telegramBotToken: config.telegramBotToken ? '****' + config.telegramBotToken.slice(-4) : '',
                    model: config.model,
                    maxTokens: config.maxTokens,
                    temperature: config.temperature,
                    dashboardPort: config.dashboardPort
                }));
            } else if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const updates = JSON.parse(body);
                        const config = getConfig();

                        // Only update non-empty values
                        if (updates.geminiApiKey && !updates.geminiApiKey.startsWith('****')) {
                            config.geminiApiKey = updates.geminiApiKey;
                        }
                        if (updates.claudeApiKey && !updates.claudeApiKey.startsWith('****')) {
                            config.claudeApiKey = updates.claudeApiKey;
                        }
                        if (updates.telegramBotToken && !updates.telegramBotToken.startsWith('****')) {
                            config.telegramBotToken = updates.telegramBotToken;
                            connectedBots.telegram.enabled = true;
                            connectedBots.telegram.token = updates.telegramBotToken;
                        }
                        if (updates.model) config.model = updates.model;
                        if (updates.maxTokens) config.maxTokens = parseInt(updates.maxTokens);
                        if (updates.temperature) config.temperature = parseFloat(updates.temperature);

                        saveConfig(config);
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true }));
                    } catch (e) {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
            }
            break;
        }

        case '/api/bots': {
            res.writeHead(200);
            res.end(JSON.stringify(connectedBots));
            break;
        }

        default:
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
    }
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
