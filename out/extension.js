"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// extension.ts
const vscode = __importStar(require("vscode"));
const webviewContent_1 = require("./webviewContent");
const codeEmotion_1 = require("./codeEmotion");
const child_process_1 = require("child_process");
const isCppFile = (editor) => {
    const languageId = editor.document.languageId;
    return languageId === 'c' || languageId === 'cpp';
};
let codeEmotion;
let lastActiveEditor;
// let currentPanel: vscode.WebviewPanel | undefined;
const activePanels = new Map();
let heatmapVisible = false;
let blue;
const storedDecorationsPerFile = new Map();
// let blue: vscode.TextEditorDecorationType;
function createDecorationTypes() {
    blue = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 64, 128, 0.88)'
    });
}
function applyDecorations(editor) {
    const fileData = storedDecorationsPerFile.get(editor.document.fileName);
    if (!fileData)
        return;
    // Apply all stored decorations to the editor
    for (const { type, range } of fileData.decorations) {
        editor.setDecorations(type, [range]);
    }
}
function clearDecorations(editor) {
    const fileData = storedDecorationsPerFile.get(editor.document.fileName);
    if (!fileData)
        return;
    // Only hide the decorations instead of disposing of them
    for (const { type } of fileData.decorations) {
        editor.setDecorations(type, []); // Hide the decorations from the editor
    }
}
function toggleHeatmapFunction() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const filePath = editor.document.fileName;
    const fileData = storedDecorationsPerFile.get(filePath);
    if (!fileData) {
        vscode.window.showWarningMessage('Heatmap data not found yet. Please run "Analyze Complexity" first.');
        return;
    }
    if (heatmapVisible) {
        // Clear the decorations only from the editor, not from stored data
        clearDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now OFF`);
    }
    else {
        // Apply the stored decorations
        applyDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now ON`);
    }
    // Toggle heatmap visibility state
    heatmapVisible = !heatmapVisible;
}
function getColorForComplexity(score) {
    // const maxScore = 25;
    // const normalized = Math.min(Math.max((score - 1) / (maxScore - 1), 0), 1);
    // const r = Math.floor(Math.min(normalized * 150 + 50, 255));
    // const g = Math.floor(Math.min((1 - normalized) * 150 + 50, 255));
    // const b = 0;
    // return `rgb(${r}, ${g}, ${b})`;
    const complexityColorMap = {
        1: "#00ff00", // Bright green
        2: "#33ff00",
        3: "#66ff00",
        4: "#99ff00",
        5: "#ccff00", // Green-yellow
        6: "#eeff00",
        7: "#ffff00", // Yellow
        8: "#ffdd00",
        9: "#ffbb00",
        10: "#ff9900", // Orange
        11: "#ff7700",
        12: "#ff5500",
        13: "#ff3300",
        14: "#ff2200",
        15: "#ff1100",
        16: "#ff0000", // Red
        17: "#e60000",
        18: "#cc0000",
        19: "#b30000",
        20: "#990000",
        21: "#800000",
        22: "#660000",
        23: "#4d0000",
        24: "#330000",
        25: "#1a0000" // Dark maroon
    };
    const safeScore = Math.max(1, Math.min(score, 25));
    return complexityColorMap[safeScore];
}
function runLizardAndDecorate(panel, editorOverride) {
    const editor = editorOverride ?? lastActiveEditor;
    // const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }
    const filePath = editor.document.fileName;
    const langMap = {
        'c': 'cpp', 'cpp': 'cpp', 'cc': 'cpp', 'h': 'cpp',
        'java': 'java', 'cs': 'cs', 'js': 'javascript', 'ts': 'typescript',
        'py': 'python', 'm': 'objc', 'mm': 'objc', 'swift': 'swift',
        'rb': 'ruby', 'scala': 'scala', 'go': 'go', 'kt': 'kotlin',
        'kts': 'kotlin', 'rs': 'rust'
    };
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const lang = langMap[ext];
    if (!lang) {
        vscode.window.showErrorMessage('Unsupported file type.');
        return;
    }
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const lizardProcess = (0, child_process_1.spawn)(pythonCmd, ['-m', 'lizard', '-l', lang, '-C', '0', filePath]);
    let output = '';
    let error = '';
    lizardProcess.stdout.on('data', data => output += data.toString());
    lizardProcess.stderr.on('data', data => error += data.toString());
    lizardProcess.on('close', () => {
        if (error) {
            vscode.window.showErrorMessage(`Lizard error: ${error}`);
            return;
        }
        const lines = output.split('\n').filter(line => line.includes('@'));
        const functions = [];
        const uniqueLines = new Set();
        const decorations = {
            decorations: [],
            functions
        };
        for (const line of lines) {
            const match = line.match(/^(\s*)(\d+)\s+(\d+)\s+\d+\s+\d+\s+\d+\s+([^\s@]+)@(\d+)-(\d+)@/);
            if (match) {
                const nloc = parseInt(match[2], 10);
                const score = parseInt(match[3], 10);
                const name = match[4];
                const startLine = parseInt(match[5], 10);
                const endLine = parseInt(match[6], 10);
                const key = `${name}@${startLine}`;
                if (uniqueLines.has(key)) {
                    continue;
                }
                uniqueLines.add(key);
                const color = getColorForComplexity(score);
                functions.push({ name, score, line: startLine, endLine, nloc, color });
                const decorationType = vscode.window.createTextEditorDecorationType({
                    backgroundColor: color
                });
                // const range = new vscode.Range(startLine - 1, 0, endLine - 1, 1000);
                const range = {
                    range: new vscode.Range(startLine, 0, endLine - 1, 1000),
                    hoverMessage: `Complexity: ${score}`
                };
                // decorations.decorations.push(decor);
                decorations.decorations.push({ type: decorationType, range });
            }
        }
        console.log(decorations.decorations);
        storedDecorationsPerFile.set(filePath, decorations);
        // heatmapVisible = false;
        console.log("Functions to display:", functions);
        if (panel) {
            const tableData = functions.map(f => ({
                functionName: f.name,
                complexity: f.score,
                loc: f.nloc,
                location: `${f.line}-${f.endLine}`,
                color: f.color
            }));
            console.log("Sending data to panel:", tableData);
            panel.webview.postMessage({
                command: 'displayComplexity',
                data: tableData
            });
        }
        else {
            vscode.window.showErrorMessage("Analysis panel is not open. Please open the Code Review Checklist first.");
        }
    });
}
function activate(context) {
    codeEmotion = new codeEmotion_1.CodeEmotion();
    createDecorationTypes();
    let disposable = vscode.commands.registerCommand('code-review-helper.detectFunctions', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found!');
            return;
        }
        lastActiveEditor = editor;
        const document = editor.document;
        const text = document.getText();
        const filePath = document.fileName;
        const fileName = document.fileName.split(/[\\/]/).pop();
        const functionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
        let functions = [];
        let match;
        while ((match = functionRegex.exec(text)) !== null) {
            functions.push({ name: match[1], body: match[3] });
        }
        // Check if a panel for this file already exists
        const existingPanel = activePanels.get(filePath);
        if (existingPanel) {
            existingPanel.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel('refactorSuggestions', `Code Review Checklist - ${fileName}`, vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        // panel.webview.html = getWebviewContent(fileName || 'Untitled');
        // currentPanel = panel;
        // Add panel to tracking map
        activePanels.set(filePath, panel);
        // Handle panel disposal
        panel.onDidDispose(() => {
            activePanels.delete(filePath);
        }, null, context.subscriptions);
        panel.webview.html = (0, webviewContent_1.getWebviewContent)(fileName || 'Untitled');
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'checkRefactor':
                    if (!isCppFile(editor)) {
                        vscode.window.showWarningMessage(`Refactoring analysis is only available for C/C++ files, NOT (${fileName}).`, "OK");
                        return;
                    }
                    // Clear and show only refactor section
                    panel?.webview.postMessage({
                        command: 'resetAndShow',
                        show: 'refactor'
                    });
                    const refactorContent = (0, webviewContent_1.getRefactorHTMLContent)(functions);
                    panel?.webview.postMessage({
                        command: 'displayRefactor',
                        content: {
                            html: refactorContent.html,
                            issueCount: refactorContent.issueCount
                        }
                    });
                    break;
                case 'analyzeComplexity':
                    // Clear and show only complexity section
                    panel?.webview.postMessage({
                        command: 'resetAndShow',
                        show: 'complexity'
                    });
                    runLizardAndDecorate(panel);
                    break;
                case 'completeTask':
                    vscode.window.showInformationMessage(`Task completed: ${message.task}`);
                    break;
                case 'refreshExtension':
                    storedDecorationsPerFile.clear(); // Clear decorations
                    codeEmotion?.reset?.(); // Reset internal state
                    vscode.window.showInformationMessage('🔄 Extension progress has been refreshed.');
                    break;
            }
        }, undefined, context.subscriptions);
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document) {
                return;
            }
            codeEmotion.updateEmojiDecorations(editor, fileName || 'Untitled');
        });
    });
    context.subscriptions.push(vscode.commands.registerCommand('heatmap.toggleHeatmap', () => toggleHeatmapFunction()));
    context.subscriptions.push({
        dispose: () => codeEmotion.dispose(),
    });
    context.subscriptions.push(disposable);
}
// export function deactivate() {
//     if (blue) {
//         blue.dispose();
//     }
//     if (currentPanel) {
//         currentPanel.dispose();
//     }
// }
function deactivate() {
    // Dispose of the decoration type
    if (blue) {
        blue.dispose();
    }
    // Dispose of all active panels
    for (const panel of activePanels.values()) {
        panel.dispose();
    }
    activePanels.clear();
    // Dispose of any other resources if needed
    if (codeEmotion) {
        codeEmotion.dispose();
    }
}
//# sourceMappingURL=extension.js.map