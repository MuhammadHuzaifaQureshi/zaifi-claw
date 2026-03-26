// ⚡ Zaifi Claw — AI Module (Gemini / Claude)

import { getConfig } from './config.js';

// --- System Prompt ---
const SYSTEM_PROMPT = `You are Zaifi Claw, an AI coding assistant running in the user's terminal.

Your capabilities:
- You can read and write files when asked
- You can explain code, fix bugs, and generate code
- You can run shell commands when requested
- Be concise, accurate, and helpful
- Use markdown formatting (code blocks with language, bold, lists)
- When showing code changes, use clear before/after examples

Keep responses focused. Don't over-explain unless asked.`;

// --- Chat with AI ---
export async function chat(messages, onStream = null) {
    const config = getConfig();

    if (config.geminiApiKey) {
        return callGemini(messages, config, onStream);
    } else if (config.claudeApiKey) {
        return callClaude(messages, config);
    } else {
        throw new Error('No API key configured. Run: zaificlaw --setup');
    }
}

// --- Gemini API (FREE) ---
async function callGemini(messages, config, onStream) {
    const contents = [];

    for (const msg of messages) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:${onStream ? 'streamGenerateContent' : 'generateContent'}?key=${config.geminiApiKey}`;

    const body = {
        contents,
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature
        }
    };

    // Streaming mode
    if (onStream) {
        const response = await fetch(url + '&alt=sse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(`Gemini API error ${response.status}: ${err?.error?.message || 'Unknown'}`);
        }

        let fullText = '';
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    try {
                        const json = JSON.parse(data);
                        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            fullText += text;
                            onStream(text);
                        }
                    } catch (e) {}
                }
            }
        }

        return fullText;
    }

    // Non-streaming mode
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error ${response.status}: ${err?.error?.message || 'Unknown'}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Empty response from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
}

// --- Claude API (Paid backup) ---
async function callClaude(messages, config) {
    const apiMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.claudeApiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: config.maxTokens,
            system: SYSTEM_PROMPT,
            messages: apiMessages
        })
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

// --- Get AI info for dashboard ---
export function getAIInfo() {
    const config = getConfig();
    return {
        provider: config.geminiApiKey ? 'Gemini' : config.claudeApiKey ? 'Claude' : 'Not configured',
        model: config.model,
        hasKey: !!(config.geminiApiKey || config.claudeApiKey)
    };
}
