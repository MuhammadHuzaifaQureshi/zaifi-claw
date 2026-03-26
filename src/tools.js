// ⚡ Zaifi Claw — Coding Tools (File I/O, Exec, Search)

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join, relative, resolve } from 'path';
import { execSync } from 'child_process';

const CWD = process.cwd();

// --- Read File ---
export function readFile(filePath) {
    try {
        const absPath = resolve(CWD, filePath);
        if (!existsSync(absPath)) {
            return { success: false, error: `File not found: ${filePath}` };
        }
        const content = readFileSync(absPath, 'utf-8');
        const lines = content.split('\n').length;
        return {
            success: true,
            path: filePath,
            content,
            lines,
            size: Buffer.byteLength(content, 'utf-8')
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- Write File ---
export function writeFile(filePath, content) {
    try {
        const absPath = resolve(CWD, filePath);
        const dir = join(absPath, '..');
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(absPath, content, 'utf-8');
        return {
            success: true,
            path: filePath,
            size: Buffer.byteLength(content, 'utf-8')
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- List Files ---
export function listFiles(dirPath = '.', depth = 2) {
    try {
        const absPath = resolve(CWD, dirPath);
        if (!existsSync(absPath)) {
            return { success: false, error: `Directory not found: ${dirPath}` };
        }

        const results = [];

        function walk(dir, currentDepth) {
            if (currentDepth > depth) return;
            try {
                const entries = readdirSync(dir);
                for (const entry of entries) {
                    // Skip common ignorable dirs
                    if (['node_modules', '.git', '.next', '__pycache__', '.venv', 'dist'].includes(entry)) continue;

                    const fullPath = join(dir, entry);
                    try {
                        const stat = statSync(fullPath);
                        const relPath = relative(CWD, fullPath);
                        if (stat.isDirectory()) {
                            results.push({ path: relPath + '/', type: 'dir' });
                            walk(fullPath, currentDepth + 1);
                        } else {
                            results.push({
                                path: relPath,
                                type: 'file',
                                size: stat.size
                            });
                        }
                    } catch (e) {}
                }
            } catch (e) {}
        }

        walk(absPath, 0);
        return { success: true, files: results, total: results.length };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- Execute Shell Command ---
export function exec(command, timeout = 10000) {
    try {
        const output = execSync(command, {
            cwd: CWD,
            timeout,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return {
            success: true,
            command,
            output: output.trim()
        };
    } catch (e) {
        return {
            success: false,
            command,
            error: e.stderr?.trim() || e.message,
            output: e.stdout?.trim() || ''
        };
    }
}

// --- Search in Files (grep) ---
export function searchFiles(query, dirPath = '.', extensions = []) {
    try {
        const absPath = resolve(CWD, dirPath);
        const results = [];

        function search(dir, depth) {
            if (depth > 5) return;
            try {
                const entries = readdirSync(dir);
                for (const entry of entries) {
                    if (['node_modules', '.git', '.next', 'dist'].includes(entry)) continue;

                    const fullPath = join(dir, entry);
                    try {
                        const stat = statSync(fullPath);
                        if (stat.isDirectory()) {
                            search(fullPath, depth + 1);
                        } else if (stat.isFile() && stat.size < 500000) {
                            // Filter by extension if provided
                            if (extensions.length > 0) {
                                const ext = entry.split('.').pop();
                                if (!extensions.includes(ext)) continue;
                            }

                            const content = readFileSync(fullPath, 'utf-8');
                            const lines = content.split('\n');
                            const matches = [];

                            lines.forEach((line, i) => {
                                if (line.toLowerCase().includes(query.toLowerCase())) {
                                    matches.push({
                                        line: i + 1,
                                        content: line.trim().slice(0, 200)
                                    });
                                }
                            });

                            if (matches.length > 0) {
                                results.push({
                                    file: relative(CWD, fullPath),
                                    matches
                                });
                            }
                        }
                    } catch (e) {}
                }
            } catch (e) {}
        }

        search(absPath, 0);
        return {
            success: true,
            query,
            results,
            totalMatches: results.reduce((sum, r) => sum + r.matches.length, 0)
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// --- Get Project Info ---
export function getProjectInfo() {
    const info = {
        cwd: CWD,
        hasPackageJson: existsSync(join(CWD, 'package.json')),
        hasGit: existsSync(join(CWD, '.git')),
    };

    if (info.hasPackageJson) {
        try {
            const pkg = JSON.parse(readFileSync(join(CWD, 'package.json'), 'utf-8'));
            info.projectName = pkg.name;
            info.version = pkg.version;
        } catch (e) {}
    }

    const fileList = listFiles('.', 1);
    if (fileList.success) {
        info.fileCount = fileList.total;
    }

    return info;
}
