import fs from 'fs';
import path from 'path';
import os from 'os';

async function testKey() {
    const configPath = path.join(os.homedir(), '.zaificlaw', 'config.json');
    let apiKey = '';
    
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            apiKey = config.geminiApiKey;
        } catch (e) {
            console.log("❌ Error reading config.json:", e.message);
        }
    }

    if (!apiKey) {
        console.log("❌ Error: API Key nahi mili. Pehle 'node bin/zaificlaw.js --setup' se key set karein.");
        return;
    }

    console.log(`🔍 Testing Key: ${apiKey.substring(0, 5)}...`);
    
    // Using native fetch (Node 18+)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hi" }] }]
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log("✅ SUCCESS! API Key is working.");
            console.log("Response:", data.candidates[0].content.parts[0].text);
        } else {
            console.log("❌ FAILED! Status:", response.status);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log("❌ ERROR during fetch:", e.message);
    }
}

testKey();
