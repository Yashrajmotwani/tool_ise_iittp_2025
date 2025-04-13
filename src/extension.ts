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
    if (!decorations) { return; }

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
    const maxScore = 25; // Maximum score for Lizard's complexity measure
    // Normalize the score to be between 0 and 1, considering that score >= 1
    const normalized = Math.min(Math.max((score - 1) / (maxScore - 1), 0), 1);

    // Adjust the color range to make it less bright
    const r = Math.floor(Math.min(normalized * 150 + 50, 255)); // Red increases as score increases but stays moderate
    const g = Math.floor(Math.min((1 - normalized) * 150 + 50, 255)); // Green decreases but stays moderate
    const b = 0; // We will keep blue as 0 to get the green-red range

    // Return a more readable color with lower brightness
    return `rgb(${r}, ${g}, ${b})`;
}







// function runLizardAndDecorate() {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) {
//         vscode.window.showErrorMessage('No active editor');
//         return;
//     }

//     const filePath = editor.document.fileName;
//     const ext = filePath.split('.').pop()?.toLowerCase();
//     if (!['cpp', 'c', 'java', 'py'].includes(ext ?? '')) {
//         vscode.window.showErrorMessage('Unsupported file type.');
//         return;
//     }

//     let lang = 'cpp';
//     if (ext === 'java') { lang = 'java'; }
//     else if (ext === 'py') { lang = 'python'; }

//     const lizardPath = 'C:\\Users\\dell\\AppData\\Roaming\\Python\\Python313\\Scripts\\lizard.exe';
//     const lizardProcess = spawn(lizardPath, ['-l', lang, '-C', '0', filePath]);

//     let output = '';
//     let error = '';

//     lizardProcess.stdout.on('data', data => output += data.toString());
//     lizardProcess.stderr.on('data', data => error += data.toString());

//     lizardProcess.on('close', () => {
//         if (error) {
//             vscode.window.showErrorMessage(`Lizard error: ${error}`);
//             return;
//         }

//         const lines = output.split('\n').filter(line => line.includes('@'));
//         const functions: FunctionInfo[] = [];
//         const uniqueLines = new Set<string>();

//         const decorations: FileDecorations = {
//             green: [],
//             yellow: [],
//             red: [],
//             functions
//         };

//         for (const line of lines) {
//             const match = line.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+([^\s@]+)@(\d+)-\d+@/);
//             if (match) {
//                 const rawScore = parseInt(match[1], 10);
//                 // const score = Math.min(rawScore, 10);
//                 const score = rawScore;
//                 const name = match[2];
//                 const lineNum = parseInt(match[3], 10);
//                 const key = `${name}@${lineNum}`;
//                 if (uniqueLines.has(key)) { continue; }
//                 uniqueLines.add(key);

//                 functions.push({ name, score, line: lineNum });

//                 const range = new vscode.Range(lineNum - 1, 0, lineNum - 1, 100);
//                 const hoverMessage = `Complexity: ${score}`;
//                 const decor: vscode.DecorationOptions = { range, hoverMessage };

//                 if (score <= 5) {
//                     decorations.green.push(decor);
//                 } else if (score <= 8) {
//                     decorations.yellow.push(decor);
//                 } else {
//                     decorations.red.push(decor);
//                 }
//             }
//         }

//         storedDecorationsPerFile.set(filePath, decorations);
//         applyDecorations(editor);
//         heatmapVisible = true;
//         vscode.window.showInformationMessage(`Heatmap is now ON`);
//         showOrUpdateWebView(filePath);
//     });
// }

// function runLizardAndDecorate() {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) {
//         vscode.window.showErrorMessage('No active editor');
//         return;
//     }

//     const filePath = editor.document.fileName;
//     const ext = filePath.split('.').pop()?.toLowerCase();
//     if (!['cpp', 'c', 'java', 'py'].includes(ext ?? '')) {
//         vscode.window.showErrorMessage('Unsupported file type.');
//         return;
//     }

//     let lang = 'cpp';
//     if (ext === 'java') { lang = 'java'; }
//     else if (ext === 'py') { lang = 'python'; }

//     const lizardPath = 'C:\\Users\\dell\\AppData\\Roaming\\Python\\Python313\\Scripts\\lizard.exe';
//     const lizardProcess = spawn(lizardPath, ['-l', lang, '-C', '0', filePath]);

//     let output = '';
//     let error = '';

//     lizardProcess.stdout.on('data', data => output += data.toString());
//     lizardProcess.stderr.on('data', data => error += data.toString());

//     lizardProcess.on('close', () => {
//         if (error) {
//             vscode.window.showErrorMessage(`Lizard error: ${error}`);
//             return;
//         }

//         const lines = output.split('\n').filter(line => line.includes('@'));
//         const functions: FunctionInfo[] = [];
//         const uniqueLines = new Set<string>();

//         for (const line of lines) {
//             const match = line.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+([^\s@]+)@(\d+)-\d+@/);
//             if (match) {
//                 const rawScore = parseInt(match[1], 10);
//                 const score = rawScore;
//                 const name = match[2];
//                 const lineNum = parseInt(match[3], 10);
//                 const key = `${name}@${lineNum}`;
//                 if (uniqueLines.has(key)) { continue; }
//                 uniqueLines.add(key);

//                 functions.push({ name, score, line: lineNum });

//                 const range = new vscode.Range(lineNum - 1, 0, lineNum - 1, 100);
//                 const hoverMessage = `Complexity: ${score}`;
//                 const color = getColorForComplexity(score);

//                 const decorationType = vscode.window.createTextEditorDecorationType({
//                     isWholeLine: true,
//                     backgroundColor: color
//                 });

//                 const decor: vscode.DecorationOptions = { range, hoverMessage };
//                 editor.setDecorations(decorationType, [decor]);
//             }
//         }

//         storedDecorationsPerFile.set(filePath, { green: [], yellow: [], red: [], functions });
//         heatmapVisible = true;
//         vscode.window.showInformationMessage(`Heatmap is now ON`);
//         showOrUpdateWebView(filePath);
//     });
// }

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
    if (ext === 'java') {lang = 'java';}
    else if (ext === 'py') {lang = 'python';}

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
        const uniqueLines = new Set<string>();

        const decorations: FileDecorations = {
            green: [],
            yellow: [],
            red: [],
            functions
        };

        for (const line of lines) {
            const match = line.match(/^\s*\d+\s+\d+\s+\d+\s+\d+\s+(\d+)\s+([^\s@]+)@(\d+)-\d+@/);
            if (match) {
                const rawScore = parseInt(match[1], 10);
                const score = rawScore;
                const name = match[2];
                const lineNum = parseInt(match[3], 10);
                const key = `${name}@${lineNum}`;
                if (uniqueLines.has(key)) {continue;}
                uniqueLines.add(key);

                functions.push({ name, score, line: lineNum });

                const range = new vscode.Range(lineNum - 1, 0, lineNum - 1, 100);
                const hoverMessage = `Complexity: ${score}`;
                const color = getColorForComplexity(score);

                // Define the decoration options with background color
                const decorationType = vscode.window.createTextEditorDecorationType({
                    light: {
                        backgroundColor: color
                    },
                    dark: {
                        backgroundColor: color
                    }
                });

                const decor: vscode.DecorationOptions = {
                    range,
                    hoverMessage,
                };

                // Apply decoration to the editor using the decorationType
                editor.setDecorations(decorationType, [decor]);

                if (score <= 5) {decorations.green.push(decor);}
                else if (score <= 8) {decorations.yellow.push(decor);}
                else {decorations.red.push(decor);}
            }
        }

        storedDecorationsPerFile.set(filePath, decorations);
        heatmapVisible = true;
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
        `<tr><td>${fn.line}</td><td>${fn.name}</td><td>${fn.score}</td></tr>`
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
                <tr><th>Line</th><th>Function</th><th>Complexity</th></tr>
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

export function deactivate() {}
