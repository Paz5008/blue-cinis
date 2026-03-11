/**
 * HANDOFF File Watcher
 * Watches .ai/HANDOFF.md for changes and triggers Paz (OpenClaw)
 * 
 * Usage: node watch_handoff.js
 * Or integrated into paz-interface server.js
 */

const fs = require('fs');
const path = require('path');

const HANDOFF_PATH = path.join(__dirname, 'HANDOFF.md');
const DEBOUNCE_MS = 2000; // Wait 2 seconds before triggering

let debounceTimer = null;
let lastContent = '';

function onHandoffChange() {
    const currentContent = fs.readFileSync(HANDOFF_PATH, 'utf-8');

    // Only trigger if content actually changed
    if (currentContent === lastContent) return;
    lastContent = currentContent;

    console.log(`[${new Date().toISOString()}] 📡 HANDOFF.md changed! Notifying Paz...`);

    // Extract the "Next for Paz" section
    const pazTaskMatch = currentContent.match(/\*\*Next for Paz:\*\*\n([\s\S]*?)(?=\n---|\n##|$)/);
    if (pazTaskMatch) {
        const tasks = pazTaskMatch[1].trim();
        console.log('📋 New tasks for Paz:', tasks);

        // Trigger Paz via paz-interface API
        fetch('http://localhost:3001/api/ai-bridge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[AUTO-TRIGGER] HANDOFF.md a changé. Voici tes nouvelles tâches:\n\n${tasks}\n\nLis le fichier complet si besoin: /home/paz/projects/Blue-Cinis/blue-cinis/.ai/HANDOFF.md`,
                responseFile: '/home/paz/projects/Blue-Cinis/blue-cinis/.ai/gemini/inbox/paz-auto-response.json',
                subject: 'Auto-Handoff Notification'
            })
        })
            .then(res => res.json())
            .then(data => console.log('✅ Paz notified:', data.success ? 'OK' : 'FAILED'))
            .catch(err => console.error('❌ Failed to notify Paz:', err.message));
    }
}

function startWatcher() {
    console.log(`👀 Watching: ${HANDOFF_PATH}`);
    console.log('Press Ctrl+C to stop.\n');

    // Initial read
    if (fs.existsSync(HANDOFF_PATH)) {
        lastContent = fs.readFileSync(HANDOFF_PATH, 'utf-8');
    }

    // Watch for changes
    fs.watch(HANDOFF_PATH, (eventType) => {
        if (eventType === 'change') {
            // Debounce to avoid multiple triggers on single save
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(onHandoffChange, DEBOUNCE_MS);
        }
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Watcher stopped.');
    process.exit(0);
});

startWatcher();
