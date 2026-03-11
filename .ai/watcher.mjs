/**
 * HANDOFF Watcher v2 - Using Chokidar for reliability
 * Watches .ai/HANDOFF.md and triggers Paz via API
 * 
 * Usage: node watcher.js
 */

import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HANDOFF_PATH = path.join(__dirname, 'HANDOFF.md');

let lastContent = '';
let isProcessing = false;

async function notifyPaz(tasks) {
    if (isProcessing) return;
    isProcessing = true;

    console.log(`[${new Date().toISOString()}] 📡 Notifying Paz...`);

    try {
        const response = await fetch('http://localhost:3001/api/ai-bridge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[AUTO-HANDOFF] Le fichier a changé.\n\n**Nouvelles tâches:**\n${tasks}\n\nFichier: ${HANDOFF_PATH}`,
                responseFile: path.join(__dirname, 'gemini/inbox/paz-auto-response.json'),
                subject: 'Auto-Handoff Notification'
            })
        });

        const data = await response.json();
        console.log('✅ Paz notified:', data.success ? 'OK' : 'FAILED');

        // Update HANDOFF with Paz's response if available
        if (data.response) {
            console.log('📩 Paz response preview:', data.response.substring(0, 100) + '...');
        }
    } catch (err) {
        console.error('❌ Failed to notify Paz:', err.message);
    }

    isProcessing = false;
}

function onFileChange(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Skip if content hasn't actually changed
    if (content === lastContent) return;
    lastContent = content;

    console.log(`[${new Date().toISOString()}] 📝 HANDOFF.md changed`);

    // Extract "Next for Paz" section
    const pazMatch = content.match(/\*\*Next for Paz:\*\*\n([\s\S]*?)(?=\n---|\n##|$)/);
    if (pazMatch) {
        const tasks = pazMatch[1].trim();
        if (tasks.includes('[ ]')) {
            // Only notify if there are unchecked tasks
            notifyPaz(tasks);
        } else {
            console.log('ℹ️  No pending tasks for Paz');
        }
    }
}

// Initialize watcher
console.log('🚀 HANDOFF Watcher v2 (Chokidar)');
console.log(`👀 Watching: ${HANDOFF_PATH}`);
console.log('');

// Read initial content
if (fs.existsSync(HANDOFF_PATH)) {
    lastContent = fs.readFileSync(HANDOFF_PATH, 'utf-8');
}

// Start watching with chokidar
const watcher = chokidar.watch(HANDOFF_PATH, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
    }
});

watcher
    .on('change', onFileChange)
    .on('error', err => console.error('Watcher error:', err));

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Watcher stopped.');
    watcher.close();
    process.exit(0);
});

console.log('✅ Ready. Waiting for changes...\n');
