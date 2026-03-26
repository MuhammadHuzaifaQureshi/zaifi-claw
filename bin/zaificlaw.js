#!/usr/bin/env node

// ⚡ Zaifi Claw — CLI Entry Point
// Usage:
//   zaificlaw          → Interactive AI chat mode
//   zaificlaw --ui     → Open web dashboard
//   zaificlaw --setup  → Configure API keys
//   zaificlaw --help   → Show help
//   zaificlaw "prompt" → Single prompt mode

import { startCLI } from '../src/cli.js';
import { startDashboard } from '../src/server.js';
import { setup, getConfig } from '../src/config.js';
import { c, banner } from '../src/utils.js';

const args = process.argv.slice(2);

async function main() {
    // --help
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }

    // --version
    if (args.includes('--version') || args.includes('-v')) {
        console.log(`${c.accent}zaificlaw${c.reset} v1.0.0`);
        return;
    }

    // --setup
    if (args.includes('--setup')) {
        await setup();
        return;
    }

    // --ui (Web Dashboard)
    if (args.includes('--ui')) {
        banner();
        await startDashboard();
        return;
    }

    // Check if API key is configured
    const config = getConfig();
    if (!config.geminiApiKey && !config.claudeApiKey) {
        console.log(`\n${c.warn} No API key found!`);
        console.log(`${c.dim}Run ${c.accent}zaificlaw --setup${c.dim} to configure your API key.${c.reset}\n`);
        await setup();
        return;
    }

    // Single prompt mode: zaificlaw "your question"
    const nonFlagArgs = args.filter(a => !a.startsWith('--') && !a.startsWith('-'));
    if (nonFlagArgs.length > 0) {
        banner();
        const { singlePrompt } = await import('../src/cli.js');
        await singlePrompt(nonFlagArgs.join(' '));
        return;
    }

    // Default: Interactive mode
    banner();
    await startCLI();
}

function showHelp() {
    console.log(`
${c.accent}⚡ Zaifi Claw${c.reset} — AI Coding Assistant

${c.bold}USAGE${c.reset}
  ${c.accent}zaificlaw${c.reset}              Interactive AI chat mode
  ${c.accent}zaificlaw${c.reset} "prompt"      Single prompt, get answer and exit
  ${c.accent}zaificlaw --ui${c.reset}          Open web dashboard
  ${c.accent}zaificlaw --setup${c.reset}       Configure API keys
  ${c.accent}zaificlaw --help${c.reset}        Show this help

${c.bold}CHAT COMMANDS${c.reset}
  ${c.accent}/help${c.reset}                  Show commands
  ${c.accent}/clear${c.reset}                 Clear conversation
  ${c.accent}/exit${c.reset}                  Exit Zaifi Claw

${c.bold}EXAMPLES${c.reset}
  ${c.dim}$ zaificlaw${c.reset}
  ${c.dim}$ zaificlaw "explain this codebase"${c.reset}
  ${c.dim}$ zaificlaw --ui${c.reset}
`);
}

main().catch(err => {
    console.error(`${c.error} Fatal error: ${err.message}`);
    process.exit(1);
});
