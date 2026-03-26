// ⚡ Zaifi Claw — Telegram Bot Integration (Native Polling)

import { getConfig } from './config.js';
import { chat } from './ai.js';
import { c } from './utils.js';

export async function startTelegramBot() {
    const config = getConfig();
    const token = config.telegramBotToken;
    
    if (!token) {
        console.log(`${c.error} No Telegram Bot Token found in config!`);
        console.log(`${c.dim}Run 'zaificlaw --setup' or use the Web Dashboard to set it.${c.reset}`);
        return;
    }

    console.log(`\n${c.accent}🤖 Telegram Bot is starting...${c.reset}`);
    
    let lastUpdateId = 0;
    const chatHistories = {};

    console.log(`${c.success} Connected! Listening for messages on Telegram. Press Ctrl+C to stop.\n`);

    while (true) {
        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
            const data = await res.json();

            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    lastUpdateId = update.update_id;
                    if (update.message && update.message.text) {
                        const chatId = update.message.chat.id;
                        const text = update.message.text;
                        const username = update.message.from.username || update.message.from.first_name || 'User';

                        console.log(`${c.dim}[Telegram: @${username}]${c.reset} ${text}`);

                        // Send typing action
                        await fetch(`https://api.telegram.org/bot${token}/sendChatAction?chat_id=${chatId}&action=typing`);

                        if (text === '/start' || text === '/help') {
                            const welcome = "⚡ *Zaifi Claw*\n\nWelcome! I am your AI coding assistant. Send me any question, ask me to read/write files on your PC, or execute terminal commands!\n\n_Note: I run directly on your logged-in PC._";
                            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ chat_id: chatId, text: welcome, parse_mode: 'Markdown' })
                            });
                            continue;
                        }
                        
                        if (text === '/clear') {
                            chatHistories[chatId] = [];
                            await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=History cleared!`);
                            continue;
                        }

                        if (!chatHistories[chatId]) {
                            chatHistories[chatId] = [];
                        }

                        // Add user msg
                        chatHistories[chatId].push({ role: 'user', content: text });

                        try {
                            // Call AI without streaming for Telegram
                            const reply = await chat(chatHistories[chatId]);
                            chatHistories[chatId].push({ role: 'model', content: reply });

                            // Send message back
                            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: chatId,
                                    text: reply,
                                    parse_mode: 'Markdown'
                                })
                            });
                            console.log(`${c.accent}  ↳ Replied to @${username}${c.reset}`);
                        } catch (e) {
                            console.log(`${c.error} AI Error: ${e.message}`);
                            await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=Error: ${encodeURIComponent(e.message)}`);
                        }
                    }
                }
            }
        } catch (e) {
            // Wait before retry if network error
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}
