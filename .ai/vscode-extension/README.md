# Paz VS Code Extension

Auto-trigger Paz on file save for seamless Gemini-Paz collaboration.

## Features

- **Status Bar** - Shows Paz status (ON/OFF), click to toggle
- **@paz Detection** - Detects `// @paz:` comments and notifies Paz
- **Auto HANDOFF** - Updates `.ai/HANDOFF.md` on file saves
- **Manual Trigger** - Command palette: "Paz: Trigger Handoff"

## Installation

### Development mode (for testing)

```bash
cd /home/paz/projects/Blue-Cinis/blue-cinis/.ai/vscode-extension

# Open in VS Code for development
code --extensionDevelopmentPath=.
```

### Package for production

```bash
# Install vsce if needed
npm install -g @vscode/vsce

# Package
cd /home/paz/projects/Blue-Cinis/blue-cinis/.ai/vscode-extension
vsce package

# Install the .vsix file
code --install-extension paz-collab-1.0.0.vsix
```

## Configuration

In VS Code settings:

```json
{
  "paz.autoTrigger": true,
  "paz.apiUrl": "http://localhost:3001/api/ai-bridge",
  "paz.handoffPath": ".ai/HANDOFF.md"
}
```

## Usage

1. **Auto-mode**: Just save any file with `// @paz:` comment
2. **Manual**: Run command "Paz: Trigger Handoff" from palette
3. **Toggle**: Click status bar to enable/disable
