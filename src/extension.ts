import * as vscode from 'vscode';
import { spawn } from 'child_process';

let heatmapVisible = false;

let green: vscode.TextEditorDecorationType;
let yellow: vscode.TextEditorDecorationType;
let red: vscode.TextEditorDecorationType;

interface FunctionInfo {
    name: string;
    score: number;
    line: number;
}

interface FileDecorations {
    green: vscode.DecorationOptions[];
    yellow: vscode.DecorationOptions[];
    red: vscode.DecorationOptions[];
    functions: FunctionInfo[];
}

const storedDecorationsPerFile = new Map<string, FileDecorations>();
let webViewPanel: vscode.WebviewPanel | null = null;

function createDecorationTypes() {
    green = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(56, 230, 56, 0.4)' });
    yellow = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(231, 231, 30, 0.4)' });
    red = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(212, 31, 31, 0.4)' });
}

function applyDecorations(editor: vscode.TextEditor) {
    const decorations = storedDecorationsPerFile.get(editor.document.fileName);
    if (!decorations) return;

    editor.setDecorations(green, decorations.green);
    editor.setDecorations(yellow, decorations.yellow);
    editor.setDecorations(red, decorations.red);
}

function clearDecorations(editor: vscode.TextEditor) {
    editor.setDecorations(green, []);
    editor.setDecorations(yellow, []);
    editor.setDecorations(red, []);
}

function toggleHeatmapFunction() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    if (heatmapVisible) {
        clearDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now OFF`);
    } else {
        applyDecorations(editor);
        vscode.window.showInformationMessage(`Heatmap is now ON`);
    }

    heatmapVisible = !heatmapVisible;
    updateWebView(editor.document.fileName);
}

function runLizardAndDecorate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const filePath = editor.document.fileName;
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!['cpp', 'c', 'java', 'py'].includes(ext ?? '')) {
        vscode.window.showErrorMessage('Unsupported file type.');
        return;
    }

    let lang = 'cpp';
    if (ext === 'java') lang = 'java';
    else if (ext === 'py') lang = 'python';

    const lizardPath = 'C:\\Users\\dell\\AppData\\Roaming\\Python\\Python313\\Scripts\\lizard.exe';
    const lizardProcess = spawn(lizardPath, ['-l', lang, '-C', '0', filePath]);

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
        const decorations: FileDecorations = {
            green: [],
            yellow: [],
            red: [],
            functions
        };

        for (const line of lines) {
            const match = line.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+([^\s@]+)@(\d+)-\d+@/);
            if (match) {
                const score = parseInt(match[1], 10);
                const name = match[2];
                const lineNum = parseInt(match[3], 10);

                functions.push({ name, score, line: lineNum });

                const range = new vscode.Range(lineNum - 1, 0, lineNum - 1, 100);
                const decor = { range, hoverMessage: `Complexity: ${score}` };
                if (score <= 5) decorations.green.push(decor);
                else if (score <= 10) decorations.yellow.push(decor);
                else decorations.red.push(decor);
            }
        }

        storedDecorationsPerFile.set(filePath, decorations);
        applyDecorations(editor);
        heatmapVisible = true;
        vscode.window.showInformationMessage(`Heatmap is now ON`);
        showOrUpdateWebView(filePath);
    });
}

function showOrUpdateWebView(filePath: string) {
    const data = storedDecorationsPerFile.get(filePath);
    if (!data) return;

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

        webViewPanel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'toggleHeatmap') {
                    toggleHeatmapFunction();
                }
            }
        );

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
        `<tr><td>${fn.name}</td><td>${fn.score}</td><td>${fn.line}</td></tr>`
    ).join('');
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Heatmap Panel</title>
        </head>
        <body>
            <h2>Heatmap Controls</h2>
            <button onclick="toggleHeatmap()">Toggle Heatmap</button>
            <h3>Function Complexity Table</h3>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr><th>Function</th><th>Complexity</th><th>Line</th></tr>
                ${rows}
            </table>
            <script>
                const vscode = acquireVsCodeApi();
                function toggleHeatmap() {
                    vscode.postMessage({ command: 'toggleHeatmap' });
                }
            </script>
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

export function deactivate() {}
