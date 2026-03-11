/**
 * Rubber Duck Actif - Paz Comment Scanner
 * Scans code for @paz comments and triggers Paz to act.
 * Usage: node rubber-duck.mjs [--watch] [--scan-only]
 */

import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const CONFIG = {
    apiUrl: 'http://localhost:3001/api/ai-bridge',
    patterns: ['src/**/*.ts', 'src/**/*.tsx', 'components/**/*.tsx', 'app/**/*.tsx']
};

const processedComments = new Set();
let isProcessing = false;

function log(msg, type = 'info') {
    const icons = { info: '🦆', warn: '⚠️', error: '❌', success: '✅' };
    console.log(`[${new Date().toISOString()}] ${icons[type] || '•'} ${msg}`);
}

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const comments = [];

    lines.forEach((line, index) => {
        const match = line.match(/\/\/\s*@paz:\s*(.+)$/);
        if (match) {
            const instruction = match[1].trim();
            const id = `${filePath}:${index + 1}:${instruction}`;
            if (!processedComments.has(id)) {
                comments.push({ file: filePath, line: index + 1, instruction, fullLine: line.trim(), id });
            }
        }
    });
    return comments;
}

function scanProject() {
    const allComments = [];

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (['node_modules', '.next', 'dist'].includes(entry.name)) continue;

            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
                allComments.push(...scanFile(fullPath));
            }
        }
    }

    scanDir(path.join(PROJECT_ROOT, 'src'));
    scanDir(path.join(PROJECT_ROOT, 'app'));
    scanDir(path.join(PROJECT_ROOT, 'components'));
    scanDir(path.join(PROJECT_ROOT, 'lib'));

    return allComments;
}

async function notifyPaz(comment) {
    if (isProcessing) return;
    isProcessing = true;
    processedComments.add(comment.id);

    const relPath = path.relative(PROJECT_ROOT, comment.file);
    const message = `[RUBBER DUCK] 🦆

Instruction trouvée dans le code:
- Fichier: ${relPath}
- Ligne: ${comment.line}
- Instruction: ${comment.instruction}

Context: \`${comment.fullLine}\`

Ta mission: Exécute l'instruction et mets à jour le fichier.`;

    try {
        const res = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                responseFile: path.join(__dirname, 'gemini/inbox/paz-rubber-duck.json'),
                subject: 'Rubber Duck Instruction'
            })
        });
        const data = await res.json();
        log(`Paz notified: "${comment.instruction.slice(0, 40)}..."`, data.success ? 'success' : 'error');
    } catch (err) {
        log(`Failed: ${err.message}`, 'error');
    }
    isProcessing = false;
}

async function main() {
    const args = process.argv.slice(2);
    const scanOnly = args.includes('--scan-only');

    log('Rubber Duck Actif - Paz Comment Scanner');
    log(`Project: ${PROJECT_ROOT}\n`);
    log('Scanning for @paz comments...');

    const comments = scanProject();

    if (comments.length > 0) {
        log(`Found ${comments.length} @paz comment(s):`);
        comments.forEach(c => log(`  ${path.relative(PROJECT_ROOT, c.file)}:${c.line} - "${c.instruction}"`));

        if (!scanOnly) {
            for (const c of comments) await notifyPaz(c);
        }
    } else {
        log('No @paz comments found.');
    }

    if (scanOnly) process.exit(0);

    log('\nStarting watcher...');
    const patterns = CONFIG.patterns.map(p => path.join(PROJECT_ROOT, p));
    const watcher = chokidar.watch(patterns, {
        persistent: true, ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 }
    });

    watcher.on('change', async (fp) => {
        log(`Changed: ${path.basename(fp)}`);
        const found = scanFile(fp);
        for (const c of found) await notifyPaz(c);
    });

    log('✅ Watching. Write `// @paz: <instruction>` in any file!');
}

process.on('SIGINT', () => { log('Stopped.'); process.exit(0); });
main().catch(console.error);
