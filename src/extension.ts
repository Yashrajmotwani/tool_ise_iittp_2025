// extension.ts
import * as vscode from 'vscode';
import { getWebviewContent, getRefactorHTMLContent } from './webviewContent';
import { CodeEmotion } from './codeEmotion';

const isCppFile = (editor: vscode.TextEditor) => {
    const languageId = editor.document.languageId;
    return languageId === 'c' || languageId === 'cpp';
};

let codeEmotion: CodeEmotion;

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
    });
}

export function activate(context: vscode.ExtensionContext) {
    codeEmotion = new CodeEmotion();
    createDecorationTypes();

    let disposable = vscode.commands.registerCommand('code-review-helper.detectFunctions', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found!');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const fileName = document.fileName.split(/[\\/]/).pop();

        const functionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
        
        let functions: { name: string, body: string }[] = [];
        let match: RegExpExecArray | null;
        while ((match = functionRegex.exec(text)) !== null) {
            functions.push({ name: match[1], body: match[3] });
        }

        const panel = vscode.window.createWebviewPanel(
            'refactorSuggestions',
            `Code Review Checklist - ${fileName}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent(fileName || 'Untitled');

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'checkRefactor':
                        if (!isCppFile(editor)) {
                            vscode.window.showWarningMessage(
                                `Refactoring analysis is only available for C/C++ files, NOT (${fileName}).`,
                                "OK"
                            );
                            return;
                        }
                        const refactorContent = getRefactorHTMLContent(functions);
                        panel.webview.postMessage({
                            command: 'displayRefactor',
                            content: {
                                html: refactorContent.html,
                                issueCount: refactorContent.issueCount
                            }
                        });
                        break;
                        
                    case 'completeTask':
                        vscode.window.showInformationMessage(`Task completed: ${message.task}`);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        // Emoji decorations
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document) {
                return;
            }

            codeEmotion.updateEmojiDecorations(editor, fileName || 'Untitled');
        });
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('heatmap.analyzeComplexity', () => runLizardAndDecorate()),
        vscode.commands.registerCommand('heatmap.toggleHeatmap', () => toggleHeatmapFunction())
    );

    context.subscriptions.push({
        dispose: () => codeEmotion.dispose(),
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {
    if (blue) {
        blue.dispose();
    }
}