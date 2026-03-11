/**
 * Shadow TDD - Test-Driven AI Development
 * Watches for test files and triggers Paz to write implementation
 */

import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const API_URL = 'http://localhost:3001/api/ai-bridge';

let isProcessing = false;

function log(msg, type = 'info') {
    const icons = { info: '🧪', warn: '⚠️', error: '❌', success: '✅' };
    console.log(`[${new Date().toISOString()}] ${icons[type]} ${msg}`);
}

function parseTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const tests = [];

    // Match test descriptions
    const itMatches = content.matchAll(/(?:it|test)\s*\(\s*['"`](.+?)['"`]/g);
    for (const m of itMatches) tests.push(m[1]);

    // Find implementation file path
    const testName = path.basename(filePath);
    const implName = testName.replace(/\.(test|spec)\.(ts|tsx)$/, '.$2');
    const implPath = path.join(path.dirname(filePath), implName);

    return { filePath, content, tests, implPath, implName };
}

async function sendToPaz(parsed) {
    if (isProcessing) return;
    isProcessing = true;

    const testList = parsed.tests.map(t => `- ${t}`).join('\n');
    const prompt = `[SHADOW TDD] 🧪

Nouveau test détecté: ${path.relative(PROJECT_ROOT, parsed.filePath)}

Tests à satisfaire:
${testList}

Fichier d'implémentation: ${parsed.implPath}

Code du test:
\`\`\`typescript
${parsed.content}
\`\`\`

Mission: Écris l'implémentation TypeScript qui fait passer tous les tests.`;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                responseFile: path.join(__dirname, 'gemini/inbox/paz-tdd.json'),
                subject: 'Shadow TDD Request'
            })
        });
        const data = await res.json();
        log(`Paz notified: ${data.success ? 'OK' : 'FAILED'}`, data.success ? 'success' : 'error');
    } catch (err) {
        log(`Error: ${err.message}`, 'error');
    }

    isProcessing = false;
}

async function onTestChange(filePath) {
    log(`Test changed: ${path.basename(filePath)}`);
    const parsed = parseTestFile(filePath);

    if (parsed.tests.length === 0) {
        log('No tests found, skipping');
        return;
    }

    log(`Found ${parsed.tests.length} test(s)`);
    parsed.tests.forEach(t => log(`  → ${t}`));
    await sendToPaz(parsed);
}

async function main() {
    log('Shadow TDD - Test-Driven AI Development');
    log(`Project: ${PROJECT_ROOT}\n`);

    const watcher = chokidar.watch(
        [path.join(PROJECT_ROOT, '**/*.test.ts'), path.join(PROJECT_ROOT, '**/*.test.tsx')],
        { persistent: true, ignoreInitial: true, ignored: ['**/node_modules/**', '**/.next/**'] }
    );

    watcher.on('add', onTestChange);
    watcher.on('change', onTestChange);

    log('✅ Watching for *.test.ts files. Create one to trigger!');
}

process.on('SIGINT', () => { log('Stopped.'); process.exit(0); });
main().catch(console.error);
