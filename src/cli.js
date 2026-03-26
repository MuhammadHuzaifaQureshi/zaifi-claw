//   Zaifi Claw — Interactive CLI Chat

import { createInterface } from 'readline';
import { chat } from './ai.js';
import { readFile, writeFile, listFiles, exec, searchFiles, getProjectInfo } from './tools.js';
import { c, Spinner, formatResponse, divider, timestamp } from './utils.js';

let conversationHistory = [];

// --- Start Interactive CLI ---
export async function startCLI() {
    const projectInfo = getProjectInfo();

    console.log(`${c.dim}  Working in: ${c.accent}${projectInfo.cwd}${c.reset}`);
    if (projectInfo.projectName) {
        console.log(`${c.dim}  Project: ${c.accent}${projectInfo.projectName}${c.dim} v${projectInfo.version || '?'}${c.reset}`);
    }
    console.log(`${c.dim}  Files: ${projectInfo.fileCount || '?'} items${c.reset}`);
    divider();
    console.log();

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `${c.accent}❯${c.reset} `,
        historySize: 100
    });

    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();

        if (!input) {
            rl.prompt();
            return;
        }

        // Handle commands
        if (input.startsWith('/')) {
            const handled = handleCommand(input, rl);
            if (handled) {
                rl.prompt();
                return;
            }
        }

        // Process with AI
        await processMessage(input, rl);
    });

    rl.on('close', () => {
        console.log(`\n${c.accent}  Goodbye!${c.reset}\n`);
        process.exit(0);
    });
}

// --- Single Prompt Mode ---
export async function singlePrompt(prompt) {
    const spinner = new Spinner('Thinking');
    spinner.start();

    try {
        conversationHistory.push({ role: 'user', content: prompt });
        const response = await chat(conversationHistory);
        spinner.stop();

        console.log();
        console.log(formatResponse(response));
        console.log();
    } catch (error) {
        spinner.stop(`${c.error} ${error.message}`);
    }
}

// --- Process Message ---
async function processMessage(input, rl) {
    // Build context-aware prompt
    let enhancedInput = input;

    // Auto-detect if user wants to read a file
    const readMatch = input.match(/(?:read|show|cat|view|open|look at)\s+([^\s]+\.\w+)/i);
    if (readMatch) {
        const result = readFile(readMatch[1]);
        if (result.success) {
            enhancedInput = `User wants to see file "${readMatch[1]}". Here is the content:\n\n\`\`\`\n${result.content}\n\`\`\`\n\nUser's original message: ${input}`;
            console.log(`${c.dim}  📂 Read: ${readMatch[1]} (${result.lines} lines)${c.reset}`);
        }
    }

    // Auto-detect file listing
    const listMatch = input.match(/(?:list|ls|show)\s+(?:files|directory|dir|folder)/i);
    if (listMatch) {
        const result = listFiles('.', 2);
        if (result.success) {
            const fileTree = result.files.map(f => f.path).join('\n');
            enhancedInput = `User wants to see the project files. Here is the file tree:\n\n${fileTree}\n\nUser's original message: ${input}`;
        }
    }

    // Auto-detect search request
    const searchMatch = input.match(/(?:search|find|grep)\s+(?:for\s+)?["']?([^"']+)["']?/i);
    if (searchMatch && !readMatch && !listMatch) {
        const result = searchFiles(searchMatch[1]);
        if (result.success && result.totalMatches > 0) {
            const matches = result.results.map(r =>
                `${r.file}:\n${r.matches.map(m => `  L${m.line}: ${m.content}`).join('\n')}`
            ).join('\n\n');
            enhancedInput = `User searched for "${searchMatch[1]}". Found ${result.totalMatches} matches:\n\n${matches}\n\nUser's original message: ${input}`;
            console.log(`${c.dim}  🔍 Found ${result.totalMatches} matches${c.reset}`);
        }
    }

    conversationHistory.push({ role: 'user', content: enhancedInput });

    // Keep only last 20 messages for context
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }

    const spinner = new Spinner('Thinking');
    spinner.start();

    try {
        // Try streaming first
        let streamed = false;
        let fullResponse = '';

        try {
            spinner.stop();
            console.log();
            process.stdout.write(`${c.dim}    ${c.reset}`);

            fullResponse = await chat(conversationHistory, (chunk) => {
                process.stdout.write(chunk);
                streamed = true;
            });

            if (streamed) {
                console.log('\n');
            }
        } catch (streamErr) {
            // Fallback to non-streaming
            if (!streamed) {
                spinner.start();
                fullResponse = await chat(conversationHistory);
                spinner.stop();
                console.log();
                console.log(formatResponse(fullResponse));
                console.log();
            }
        }

        conversationHistory.push({ role: 'assistant', content: fullResponse });

        // Check if AI wants to write a file
        const writeMatch = fullResponse.match(/(?:I'll create|Creating file|Writing to|Let me write)\s+[`"]?([^\s`"]+)[`"]?/i);
        if (writeMatch) {
            // Extract code from the response
            const codeMatch = fullResponse.match(/```\w*\n([\s\S]*?)```/);
            if (codeMatch) {
                const rl2 = createInterface({ input: process.stdin, output: process.stdout });
                const answer = await new Promise(resolve =>
                    rl2.question(`${c.accent}  Write to ${writeMatch[1]}? [y/N]: ${c.reset}`, resolve)
                );
                rl2.close();

                if (answer.toLowerCase() === 'y') {
                    const result = writeFile(writeMatch[1], codeMatch[1]);
                    if (result.success) {
                        console.log(`${c.success} Written to ${writeMatch[1]}`);
                    } else {
                        console.log(`${c.error} ${result.error}`);
                    }
                }
            }
        }

    } catch (error) {
        spinner.stop();
        console.log(`\n${c.error} ${error.message}\n`);
    }

    rl.prompt();
}

// --- Handle Slash Commands ---
function handleCommand(input, rl) {
    const cmd = input.toLowerCase().split(/\s+/)[0];
    const args = input.slice(cmd.length).trim();

    switch (cmd) {
        case '/help':
            console.log(`
${c.accent}  Commands${c.reset}
  ${c.accent}/help${c.reset}              Show this help
  ${c.accent}/clear${c.reset}             Clear conversation history
  ${c.accent}/files${c.reset}             List project files
  ${c.accent}/read <file>${c.reset}       Read a file
  ${c.accent}/search <query>${c.reset}    Search in files
  ${c.accent}/run <command>${c.reset}     Execute a shell command
  ${c.accent}/info${c.reset}              Show project info
  ${c.accent}/exit${c.reset}              Exit Zaifi Claw
`);
            return true;

        case '/clear':
            conversationHistory = [];
            console.log(`${c.success} Conversation cleared\n`);
            return true;

        case '/files':
            const files = listFiles(args || '.', 2);
            if (files.success) {
                console.log(`\n${c.accent}📁 Files (${files.total})${c.reset}`);
                files.files.forEach(f => {
                    const icon = f.type === 'dir' ? `${c.accent}📂` : `${c.dim}  `;
                    const size = f.size ? `${c.dim}(${formatSize(f.size)})${c.reset}` : '';
                    console.log(`${icon} ${f.path} ${size}${c.reset}`);
                });
                console.log();
            } else {
                console.log(`${c.error} ${files.error}\n`);
            }
            return true;

        case '/read':
            if (!args) {
                console.log(`${c.warn} Usage: /read <filepath>\n`);
                return true;
            }
            const fileResult = readFile(args);
            if (fileResult.success) {
                console.log(`\n${c.accent}📄 ${args}${c.dim} (${fileResult.lines} lines)${c.reset}\n`);
                console.log(fileResult.content);
                console.log();
            } else {
                console.log(`${c.error} ${fileResult.error}\n`);
            }
            return true;

        case '/search':
            if (!args) {
                console.log(`${c.warn} Usage: /search <query>\n`);
                return true;
            }
            const searchResult = searchFiles(args);
            if (searchResult.success) {
                console.log(`\n${c.accent}🔍 "${args}"${c.dim} — ${searchResult.totalMatches} matches${c.reset}\n`);
                searchResult.results.forEach(r => {
                    console.log(`${c.accent}  ${r.file}${c.reset}`);
                    r.matches.forEach(m => {
                        console.log(`${c.dim}    L${m.line}: ${c.reset}${m.content}`);
                    });
                });
                console.log();
            } else {
                console.log(`${c.error} ${searchResult.error}\n`);
            }
            return true;

        case '/run':
            if (!args) {
                console.log(`${c.warn} Usage: /run <command>\n`);
                return true;
            }
            console.log(`${c.dim}  Running: ${args}${c.reset}`);
            const runResult = exec(args);
            if (runResult.success) {
                console.log(runResult.output);
            } else {
                console.log(`${c.error} ${runResult.error}`);
                if (runResult.output) console.log(runResult.output);
            }
            console.log();
            return true;

        case '/info':
            const info = getProjectInfo();
            console.log(`
${c.accent}  Project Info${c.reset}
  ${c.dim}Directory:${c.reset} ${info.cwd}
  ${c.dim}Project:${c.reset}   ${info.projectName || 'N/A'}
  ${c.dim}Version:${c.reset}   ${info.version || 'N/A'}
  ${c.dim}Git:${c.reset}       ${info.hasGit ? '✔' : '✖'}
  ${c.dim}Files:${c.reset}     ${info.fileCount || '?'}
  ${c.dim}Messages:${c.reset}  ${conversationHistory.length}
`);
            return true;

        case '/exit':
        case '/quit':
            console.log(`\n${c.accent}  Goodbye!${c.reset}\n`);
            process.exit(0);

        default:
            console.log(`${c.warn} Unknown command: ${cmd}. Type ${c.accent}/help${c.reset}\n`);
            return true;
    }
}

// --- Format file size ---
function formatSize(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}
