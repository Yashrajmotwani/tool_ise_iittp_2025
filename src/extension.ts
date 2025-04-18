import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

let heatmapVisible = false;
let blue: vscode.TextEditorDecorationType;

type FunctionInfo = {
    name: string;
    score: number;
    line: number;
    endLine: number;
    nloc: number;
    color: string;
};

interface FileDecorations {
    blue: vscode.DecorationOptions[];
    functions: FunctionInfo[];
}

const storedDecorationsPerFile = new Map<string, FileDecorations>();
let webViewPanel: vscode.WebviewPanel | null = null;

function createDecorationTypes() {
    blue = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 64, 128, 0.88)' // DodgerBlue
    });
}

function applyDecorations(editor: vscode.TextEditor) {
    const decorations = storedDecorationsPerFile.get(editor.document.fileName);
    if (!decorations) { return; }
    editor.setDecorations(blue, decorations.blue);
}

function clearDecorations(editor: vscode.TextEditor) {
    editor.setDecorations(blue, []);
}

function toggleHeatmapFunction() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    if (heatmapVisible) {
        clearDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now OFF`);
    } else {
        applyDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now ON`);
    }

    heatmapVisible = !heatmapVisible;
}

function getColorForComplexity(score: number): string {
    const maxScore = 25;
    const normalized = Math.min(Math.max((score - 1) / (maxScore - 1), 0), 1);
    const r = Math.floor(Math.min(normalized * 150 + 50, 255));
    const g = Math.floor(Math.min((1 - normalized) * 150 + 50, 255));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
}

function getLizardBinaryPath(): string {
    const platform = process.platform;
    let lizardBinaryPath: string;
    if (platform === 'win32') {
        lizardBinaryPath = path.join(__dirname, 'lizard', 'lizard.exe');
    } else if (platform === 'linux' || platform === 'darwin') {
        lizardBinaryPath = path.join(__dirname, 'lizard', 'lizard');
    } else {
        vscode.window.showErrorMessage('Unsupported platform');
        throw new Error('Unsupported platform');
    }
    return lizardBinaryPath;
}

function runLizardAndDecorate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const filePath = editor.document.fileName;
    const langMap: Record<string, string> = {
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
    const lizardProcess = spawn(pythonCmd, ['-m', 'lizard', '-l', lang, '-C', '0', filePath]);

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
        const functions: FunctionInfo[] = [];
        const uniqueLines = new Set<string>();

        const decorations: FileDecorations = {
            blue: [],
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
                if (uniqueLines.has(key)) { continue; }
                uniqueLines.add(key);

                const color = getColorForComplexity(score);
                functions.push({ name, score, line: startLine, endLine, nloc, color });

                const range = new vscode.Range(startLine - 1, 0, endLine - 1, 1000);
                const decor: vscode.DecorationOptions = {
                    range,
                    hoverMessage: `Complexity: ${score}`
                };

                decorations.blue.push(decor);
            }
        }

        storedDecorationsPerFile.set(filePath, decorations);
        heatmapVisible = true;
        applyDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now ON`);
        showOrUpdateWebView(filePath);
    });
}

function showOrUpdateWebView(filePath: string) {
    const data = storedDecorationsPerFile.get(filePath);
    if (!data) { return; }

    const html = getWebViewContent(data.functions);
    if (webViewPanel) {
        webViewPanel.webview.html = html;
    } else {
        webViewPanel = vscode.window.createWebviewPanel(
            'heatmapWebView',
            'Heatmap Control Panel',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        webViewPanel.webview.html = html;

        webViewPanel.onDidDispose(() => {
            webViewPanel = null;
        });
    }
}

function updateWebView(filePath: string) {
    if (webViewPanel) {
        const data = storedDecorationsPerFile.get(filePath);
        if (data) {
            webViewPanel.webview.html = getWebViewContent(data.functions);
        }
    }
}

function getWebViewContent(functions: FunctionInfo[]): string {
    const rows = functions.map(fn =>
        `<tr>
            <td>${fn.line}-${fn.endLine}</td>
            <td>${fn.name}</td>
            <td>${fn.nloc}</td>
            <td>${fn.score}</td>
            <td style="background-color:${fn.color};">${fn.color}</td>
        </tr>`
    ).join('');

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Heatmap Panel</title>
        </head>
        <body>
            <h3>Function Complexity Table</h3>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>Lines</th>
                    <th>Function</th>
                    <th>NLOC</th>
                    <th>Complexity</th>
                    <th>Color</th>
                </tr>
                ${rows}
            </table>
        </body>
        </html>
    `;
}

export function activate(context: vscode.ExtensionContext) {
    createDecorationTypes();

    context.subscriptions.push(
        vscode.commands.registerCommand('heatmap.analyzeComplexity', () => runLizardAndDecorate()),
        vscode.commands.registerCommand('heatmap.toggleHeatmap', () => toggleHeatmapFunction()),
        vscode.commands.registerCommand('heatmap.openWebView', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                showOrUpdateWebView(editor.document.fileName);
            }
        }),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && heatmapVisible) {
                applyDecorations(editor);
                updateWebView(editor.document.fileName);
            }
        })
    );
}

export function deactivate() {
    if (blue) {
        blue.dispose();
    }
}
