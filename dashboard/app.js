// ⚡ Zaifi Claw — Dashboard Logic

const API = '';

// --- Tab Navigation ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Show tab
        const tab = item.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');

        // Update title
        document.getElementById('pageTitle').textContent =
            item.textContent.trim();
    });
});

// --- Copy Buttons ---
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.copy);
        if (target) {
            navigator.clipboard.writeText(target.textContent).then(() => {
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy', 2000);
            });
        }
    });
});

// --- Fetch Status ---
async function fetchStatus() {
    try {
        const res = await fetch(`${API}/api/status`);
        const data = await res.json();

        // Status
        document.getElementById('uptime').textContent = data.uptimeFormatted;
        document.getElementById('versionDisplay').textContent = data.version;

        // AI
        document.getElementById('aiProvider').textContent = data.ai.provider;
        document.getElementById('aiModel').textContent = data.ai.model;

        // Project
        if (data.project) {
            document.getElementById('projectDir').textContent =
                data.project.cwd?.split(/[/\\]/).slice(-2).join('/') || '—';
            document.getElementById('projectName').textContent =
                data.project.projectName || '—';
            document.getElementById('projectFiles').textContent =
                data.project.fileCount || '—';
        }

        // Gateway
        const port = window.location.port || '3456';
        document.getElementById('gatewayUrl').textContent = `http://localhost:${port}`;
        document.getElementById('apiEndpoint').textContent = `http://localhost:${port}/api/status`;
        document.getElementById('configPath').textContent = data.configPath || '~/.zaificlaw/config.json';

        // Bots
        if (data.bots?.telegram?.enabled) {
            document.getElementById('telegramStatus').textContent = 'Enabled';
            document.getElementById('telegramStatus').style.color = '#CCFF33';
            document.getElementById('telegramStatus').style.borderColor = '#CCFF33';
        }

        // Connection badge
        const badge = document.getElementById('statusBadge');
        badge.innerHTML = '<span class="status-dot"></span> Connected';

    } catch (err) {
        const badge = document.getElementById('statusBadge');
        badge.innerHTML = '<span class="status-dot" style="background:#ff4444;box-shadow:0 0 8px #ff4444"></span> Error';
    }
}

// --- Fetch Config ---
async function fetchConfig() {
    try {
        const res = await fetch(`${API}/api/config`);
        const data = await res.json();

        document.getElementById('settingGeminiKey').value = data.geminiApiKey || '';
        document.getElementById('settingClaudeKey').value = data.claudeApiKey || '';
        document.getElementById('settingModel').value = data.model || 'gemini-2.0-flash';
        document.getElementById('settingMaxTokens').value = data.maxTokens || 2048;
        document.getElementById('settingTemperature').value = data.temperature || 0.7;

        if (data.telegramBotToken) {
            document.getElementById('telegramToken').value = data.telegramBotToken;
        }
    } catch (err) {
        console.error('Failed to fetch config:', err);
    }
}

// --- Save Settings ---
document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const msg = document.getElementById('settingsMsg');

    try {
        const body = {
            geminiApiKey: document.getElementById('settingGeminiKey').value,
            claudeApiKey: document.getElementById('settingClaudeKey').value,
            model: document.getElementById('settingModel').value,
            maxTokens: document.getElementById('settingMaxTokens').value,
            temperature: document.getElementById('settingTemperature').value
        };

        const res = await fetch(`${API}/api/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.success) {
            msg.textContent = '✔ Settings saved!';
            msg.className = 'settings-msg success';
            fetchStatus();
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        msg.textContent = '✖ Failed: ' + err.message;
        msg.className = 'settings-msg error';
    }

    setTimeout(() => { msg.textContent = ''; }, 3000);
});

// --- Save Telegram ---
document.getElementById('saveTelegramBtn').addEventListener('click', async () => {
    const token = document.getElementById('telegramToken').value.trim();
    if (!token) return;

    try {
        const res = await fetch(`${API}/api/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramBotToken: token })
        });

        const data = await res.json();
        if (data.success) {
            document.getElementById('telegramStatus').textContent = 'Enabled';
            document.getElementById('telegramStatus').style.color = '#CCFF33';
            document.getElementById('telegramStatus').style.borderColor = '#CCFF33';
            alert('Telegram bot saved!');
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
});

// --- Auto-refresh ---
fetchStatus();
fetchConfig();
setInterval(fetchStatus, 5000);
