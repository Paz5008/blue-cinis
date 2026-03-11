/**
 * Paz Collaboration VS Code Extension
 * Triggers Paz on file save for seamless AI collaboration
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let statusBarItem;
let autoTriggerEnabled = true;
let lastTriggerTime = 0;
const DEBOUNCE_MS = 2000;

function activate(context) {
    console.log('Paz Collaboration extension activated');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'paz.toggleAutoTrigger';
    updateStatusBar();
    statusBarItem.show();

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('paz.triggerHandoff', triggerHandoff),
        vscode.commands.registerCommand('paz.toggleAutoTrigger', toggleAutoTrigger)
    );

    // Listen for file saves
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(onFileSave)
    );

    context.subscriptions.push(statusBarItem);
}

function updateStatusBar() {
    if (autoTriggerEnabled) {
        statusBarItem.text = '$(zap) Paz: ON';
        statusBarItem.tooltip = 'Paz auto-trigger enabled. Click to disable.';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = '$(circle-slash) Paz: OFF';
        statusBarItem.tooltip = 'Paz auto-trigger disabled. Click to enable.';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

function toggleAutoTrigger() {
    autoTriggerEnabled = !autoTriggerEnabled;
    updateStatusBar();
    vscode.window.showInformationMessage(
        `Paz auto-trigger ${autoTriggerEnabled ? 'enabled' : 'disabled'}`
    );
}

async function onFileSave(document) {
    if (!autoTriggerEnabled) return;

    // Debounce
    const now = Date.now();
    if (now - lastTriggerTime < DEBOUNCE_MS) return;
    lastTriggerTime = now;

    const config = vscode.workspace.getConfiguration('paz');
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const filePath = document.uri.fsPath;
    const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);

    // Skip node_modules, .next, etc.
    if (relativePath.includes('node_modules') ||
        relativePath.includes('.next') ||
        relativePath.includes('.git')) {
        return;
    }

    // Check for @paz comments
    const content = document.getText();
    const hasPazComment = /\/\/\s*@paz:/.test(content);

    if (hasPazComment) {
        await notifyPazAboutComment(filePath, relativePath, content);
    }

    // Update HANDOFF.md if it exists
    const handoffPath = path.join(workspaceFolder.uri.fsPath, config.get('handoffPath'));
    if (fs.existsSync(handoffPath)) {
        updateHandoff(handoffPath, relativePath);
    }
}

async function notifyPazAboutComment(filePath, relativePath, content) {
    const config = vscode.workspace.getConfiguration('paz');
    const apiUrl = config.get('apiUrl');

    // Extract @paz comment
    const match = content.match(/\/\/\s*@paz:\s*(.+)$/m);
    if (!match) return;

    const instruction = match[1];

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `[VS Code Extension] @paz comment detected!\n\nFile: ${relativePath}\nInstruction: ${instruction}`,
                subject: 'VS Code Auto-Trigger'
            })
        });

        if (response.ok) {
            vscode.window.showInformationMessage(`Paz notified: "${instruction.slice(0, 30)}..."`);
        }
    } catch (err) {
        console.error('Failed to notify Paz:', err);
    }
}

function updateHandoff(handoffPath, changedFile) {
    try {
        let content = fs.readFileSync(handoffPath, 'utf-8');

        // Update Gemini status section
        const timestamp = new Date().toISOString();
        const updateLine = `- [${timestamp}] File saved: \`${changedFile}\``;

        // Append to Gemini status if we can find the section
        if (content.includes('## 🌐 Gemini Status')) {
            content = content.replace(
                /(\*\*Last action:\*\*\s*\n)/,
                `$1${updateLine}\n`
            );
            fs.writeFileSync(handoffPath, content);
        }
    } catch (err) {
        console.error('Failed to update HANDOFF:', err);
    }
}

async function triggerHandoff() {
    const config = vscode.workspace.getConfiguration('paz');
    const apiUrl = config.get('apiUrl');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: '[VS Code Extension] Manual handoff trigger requested.',
                subject: 'Manual Handoff'
            })
        });

        if (response.ok) {
            vscode.window.showInformationMessage('Paz handoff triggered!');
        } else {
            vscode.window.showErrorMessage('Failed to trigger Paz');
        }
    } catch (err) {
        vscode.window.showErrorMessage(`Error: ${err.message}`);
    }
}

function deactivate() {
    console.log('Paz Collaboration extension deactivated');
}

module.exports = { activate, deactivate };
