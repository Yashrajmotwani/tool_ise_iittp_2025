import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

type FunctionInfo = {
    name: string;
    score: number;
    line: number;       // start line
    endLine: number;    // end line
    nloc: number;       // number of lines of code
    color: string;      // color assigned based on complexity
};

interface FileDecorations {
    decorations: {
        type: vscode.TextEditorDecorationType;
        range: vscode.DecorationOptions;
    }[];
    functions: FunctionInfo[];
}

const storedDecorationsPerFile = new Map<string, FileDecorations>();
let webViewPanel: vscode.WebviewPanel | null = null;
let heatmapVisible = false;

function getColorForComplexity(score: number): string {
    const maxScore = 25;
    const normalized = Math.min(Math.max((score - 1) / (maxScore - 1), 0), 1);

    const r = Math.floor(Math.min(normalized * 150 + 50, 255));
    const g = Math.floor(Math.min((1 - normalized) * 150 + 50, 255));
    const b = 0;

    return `rgb(${r}, ${g}, ${b})`;
}

function applyDecorations(editor: vscode.TextEditor) {
    const fileData = storedDecorationsPerFile.get(editor.document.fileName);
    if (!fileData) return;

    for (const { type, range } of fileData.decorations) {
        editor.setDecorations(type, [range]);
    }
}

function clearDecorations(editor: vscode.TextEditor) {
    const fileData = storedDecorationsPerFile.get(editor.document.fileName);
    if (!fileData) return;

    for (const { type } of fileData.decorations) {
        editor.setDecorations(type, []);
        type.dispose();
    }
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
}

function getLizardLang(filePath: string): string | null {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const langMap: Record<string, string> = {
        'c': 'cpp', 'cpp': 'cpp', 'cc': 'cpp', 'h': 'cpp',
        'java': 'java', 'cs': 'cs', 'js': 'javascript', 'ts': 'typescript',
        'py': 'python', 'm': 'objc', 'mm': 'objc',
        'swift': 'swift', 'rb': 'ruby', 'scala': 'scala', 'go': 'go',
        'kt': 'kotlin', 'kts': 'kotlin', 'rs': 'rust'
    };
    return langMap[ext] ?? null;
}

function runLizardAndDecorate() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const filePath = editor.document.fileName;
    const lang = getLizardLang(filePath);
    if (!lang) {
        vscode.window.showErrorMessage('Unsupported file type.');
        return;
    }

    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const lizardProcess = spawn(pythonCmd, ['-m', 'lizard', '-l', lang, '-C', '0', filePath]);

    let output = '', error = '';
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
            decorations: [],
            functions
        };

        const seen = new Set<string>();

        for (const line of lines) {
            const match = line.match(/^\s*(\d+)\s+(\d+)\s+\d+\s+\d+\s+\d+\s+([^\s@]+)@(\d+)-(\d+)@/);
            if (match) {
                const nloc = parseInt(match[1], 10);
                const score = parseInt(match[2], 10);
                const name = match[3];
                const startLine = parseInt(match[4], 10);
                const endLine = parseInt(match[5], 10);
                const key = `${name}@${startLine}`;
                if (seen.has(key)) continue;
                seen.add(key);

                const color = getColorForComplexity(score);
                functions.push({ name, score, line: startLine, endLine, nloc, color });

                const decorationType = vscode.window.createTextEditorDecorationType({
                    backgroundColor: color
                });

                const range: vscode.DecorationOptions = {
                    range: new vscode.Range(startLine - 1, 0, endLine - 1, 1000),
                    hoverMessage: `Complexity: ${score}`
                };

                decorations.decorations.push({ type: decorationType, range });
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
    context.subscriptions.push(
        vscode.commands.registerCommand('heatmap.analyzeComplexity', runLizardAndDecorate),
        vscode.commands.registerCommand('heatmap.toggleHeatmap', toggleHeatmapFunction),
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
    for (const fileData of storedDecorationsPerFile.values()) {
        for (const { type } of fileData.decorations) {
            type.dispose();
        }
    }
    storedDecorationsPerFile.clear();
}

