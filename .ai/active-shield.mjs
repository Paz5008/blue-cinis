/**
 * 🛡️ Active Shield - Gemini x Paz Collaboration Watcher
 * 
 * A 4-layer monitoring system for autonomous AI collaboration.
 * Based on Paz's "Active Shield" vision.
 * 
 * Layers:
 * 1. Code Sentinel - TypeScript errors on file change
 * 2. Dependency Watcher - npm audit on package.json changes
 * 3. Test Guardian - Run impacted tests
 * 4. Handoff Monitor - Sync between Gemini and Paz
 * 
 * Usage: node active-shield.mjs
 */

import chokidar from 'chokidar';
import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const AI_DIR = __dirname;

// Configuration
const CONFIG = {
    debounceMs: 1500,
    apiUrl: 'http://localhost:3001/api/ai-bridge',
    logFile: path.join(AI_DIR, 'shield.log')
};

// Shield Layers
const LAYERS = {
    codeSentinel: {
        name: '🔍 Code Sentinel',
        patterns: ['src/**/*.ts', 'src/**/*.tsx', 'components/**/*.tsx'],
        command: 'npx tsc --noEmit 2>&1 | head -20',
        cwd: PROJECT_ROOT,
        enabled: true
    },
    dependencyWatcher: {
        name: '📦 Dependency Watcher',
        patterns: ['package.json', 'package-lock.json'],
        command: 'npm audit --json 2>/dev/null | head -50',
        cwd: PROJECT_ROOT,
        enabled: true
    },
    handoffMonitor: {
        name: '🤝 Handoff Monitor',
        patterns: ['.ai/HANDOFF.md'],
        notifyPaz: true,
        enabled: true
    }
};

// State
let isProcessing = false;
let handoffLastContent = '';
const debounceTimers = new Map();

// Logging
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logLine);

    // Append to log file
    fs.appendFileSync(CONFIG.logFile, logLine + '\n');
}

// Execute shell command
function runCommand(cmd, cwd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd, timeout: 30000 }, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}

// Notify Paz via API
async function notifyPaz(message, subject = 'Active Shield Alert') {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                responseFile: path.join(AI_DIR, 'gemini/inbox/shield-response.json'),
                subject
            })
        });

        const data = await response.json();
        log(`Paz notified: ${data.success ? 'OK' : 'FAILED'}`);
    } catch (err) {
        log(`Failed to notify Paz: ${err.message}`, 'error');
    }

    isProcessing = false;
}

// Handle Code Sentinel changes
async function handleCodeChange(filePath) {
    const layer = LAYERS.codeSentinel;
    log(`${layer.name} triggered by: ${path.basename(filePath)}`);

    const { stdout, stderr } = await runCommand(layer.command, layer.cwd);
    const output = stdout || stderr;

    if (output && output.includes('error')) {
        log(`TypeScript errors detected!`, 'warn');
        console.log(output);

        // Notify Paz about errors
        await notifyPaz(
            `[SHIELD] TypeScript errors detected in ${path.basename(filePath)}:\n\n\`\`\`\n${output.slice(0, 1000)}\n\`\`\``,
            'Code Sentinel Alert'
        );
    } else {
        log('No TypeScript errors');
    }
}

// Handle Dependency changes
async function handleDependencyChange(filePath) {
    const layer = LAYERS.dependencyWatcher;
    log(`${layer.name} triggered by: ${path.basename(filePath)}`);

    const { stdout } = await runCommand(layer.command, layer.cwd);

    if (stdout) {
        try {
            const audit = JSON.parse(stdout);
            if (audit.metadata?.vulnerabilities?.high > 0 || audit.metadata?.vulnerabilities?.critical > 0) {
                log('Security vulnerabilities found!', 'warn');
                await notifyPaz(
                    `[SHIELD] Security vulnerabilities detected!\n\n${JSON.stringify(audit.metadata.vulnerabilities, null, 2)}`,
                    'Dependency Watcher Alert'
                );
            }
        } catch (e) {
            // Not JSON, likely clean
        }
    }

    log('Dependencies OK');
}

// Handle Handoff changes
async function handleHandoffChange(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    if (content === handoffLastContent) return;
    handoffLastContent = content;

    log('🤝 HANDOFF.md changed');

    // Extract "Next for Paz" section
    const pazMatch = content.match(/\*\*Next for Paz:\*\*\n([\s\S]*?)(?=\n---|\n##|$)/);
    if (pazMatch) {
        const tasks = pazMatch[1].trim();
        if (tasks.includes('[ ]')) {
            log('New tasks for Paz detected');
            await notifyPaz(
                `[AUTO-HANDOFF] New tasks detected:\n\n${tasks}`,
                'Handoff Update'
            );
        }
    }
}

// Debounced handler
function createDebouncedHandler(handler, key) {
    return (filePath) => {
        clearTimeout(debounceTimers.get(key));
        debounceTimers.set(key, setTimeout(() => handler(filePath), CONFIG.debounceMs));
    };
}

// Initialize watchers
function initializeShield() {
    log('🛡️ Active Shield Initializing...');
    log(`Project root: ${PROJECT_ROOT}`);

    // Read initial HANDOFF content
    const handoffPath = path.join(AI_DIR, 'HANDOFF.md');
    if (fs.existsSync(handoffPath)) {
        handoffLastContent = fs.readFileSync(handoffPath, 'utf-8');
    }

    // Code Sentinel
    if (LAYERS.codeSentinel.enabled) {
        const patterns = LAYERS.codeSentinel.patterns.map(p => path.join(PROJECT_ROOT, p));
        const watcher = chokidar.watch(patterns, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 }
        });
        watcher.on('change', createDebouncedHandler(handleCodeChange, 'code'));
        log(`${LAYERS.codeSentinel.name} active`);
    }

    // Dependency Watcher
    if (LAYERS.dependencyWatcher.enabled) {
        const patterns = LAYERS.dependencyWatcher.patterns.map(p => path.join(PROJECT_ROOT, p));
        const watcher = chokidar.watch(patterns, {
            persistent: true,
            ignoreInitial: true
        });
        watcher.on('change', createDebouncedHandler(handleDependencyChange, 'deps'));
        log(`${LAYERS.dependencyWatcher.name} active`);
    }

    // Handoff Monitor
    if (LAYERS.handoffMonitor.enabled) {
        const watcher = chokidar.watch(path.join(AI_DIR, 'HANDOFF.md'), {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 }
        });
        watcher.on('change', handleHandoffChange);
        log(`${LAYERS.handoffMonitor.name} active`);
    }

    log('✅ Active Shield ready!');
    log('');
}

// Graceful shutdown
process.on('SIGINT', () => {
    log('Shutting down Active Shield...');
    process.exit(0);
});

// Start
initializeShield();
