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
const vscode = __importStar(require("vscode"));
const webviewContent_1 = require("./webviewContent");
let decorationType;
function activate(context) {
    decorationType = vscode.window.createTextEditorDecorationType({});
    let disposable = vscode.commands.registerCommand('code-review-helper.detectFunctions', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found!');
            return;
        }
        const document = editor.document;
        const text = document.getText();
        const fileName = document.fileName.split(/[\\/]/).pop();
        function stripComments(code) {
            return code
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\/\/.*$/gm, '');
        }
        const cleanedText = stripComments(text);
        const functionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(?!main\b)(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
        const countFunctionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(?!if|while|for|switch\b)(\w+)\s*\(([^)]*)\)\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;
        const validFunctions = [...cleanedText.matchAll(countFunctionRegex)];
        const functionCount = validFunctions.length;
        let functions = [];
        let match;
        while ((match = functionRegex.exec(text)) !== null) {
            functions.push({ name: match[1], body: match[3] });
        }
        const issueDefinitions = {
            "Too many if-else statements! Consider using polymorphism.": "https://refactoring.guru/replace-conditional-with-polymorphism",
            "Large switch detected! Consider using the state pattern.": "https://refactoring.guru/state",
            "Nested loops detected! Try early return or breaking into smaller functions.": "https://refactoring.guru/split-loop",
            "Too many parameters! Consider encapsulating them into an object.": "https://refactoring.guru/introduce-parameter-object",
            "Magic numbers detected! Use named constants.": "https://refactoring.guru/replace-magic-number-with-symbolic-constant",
            "Missing semicolons detected!": "",
            "Trailing whitespace detected!": ""
        };
        const emojiMap = {
            "Too many if-else statements! Consider using polymorphism.": "💩",
            "Large switch detected! Consider using the state pattern.": "🌀",
            "Nested loops detected! Try early return or breaking into smaller functions.": "🔁",
            "Too many parameters! Consider encapsulating them into an object.": "📦",
            "Magic numbers detected! Use named constants.": "🔢",
            "Missing semicolons detected!": "❌",
            "Trailing whitespace detected!": "⚠️"
        };
        const panel = vscode.window.createWebviewPanel('refactorSuggestions', `Code Review Checklist - ${fileName}`, vscode.ViewColumn.One, { enableScripts: true });
        panel.webview.html = (0, webviewContent_1.getWebviewContent)(fileName || 'Untitled', functionCount);
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'checkRefactor':
                    const refactorContent = (0, webviewContent_1.getRefactorHTMLContent)(functions, issueDefinitions, emojiMap);
                    panel.webview.postMessage({
                        command: 'displayRefactor',
                        content: {
                            html: refactorContent.html,
                            issueCount: refactorContent.issueCount,
                            functionCount: functionCount
                        }
                    });
                    break;
                case 'completeTask':
                    vscode.window.showInformationMessage(`Task completed: ${message.task}`);
                    break;
            }
        }, undefined, context.subscriptions);
        // Emoji decorations
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document)
                return;
            const originalText = editor.document.getText();
            const cleanedText = stripComments(originalText);
            const decorationOptions = [];
            // Code pattern emojis
            const emojiPatterns = [
                {
                    regex: /\bif\s*\(.*?\)\s*\{/g,
                    emoji: '💩',
                    hover: 'Too many if-else statements! - Extension',
                    minCount: 3
                },
                {
                    regex: /\bswitch\s*\(.*?\)\s*\{[^}]*case[^}]*case[^}]*case/g,
                    emoji: '🌀',
                    hover: 'Large switch detected (3+ cases)! - Extension'
                },
                {
                    regex: /(\b(for|while)\s*\(.*?\)\s*\{[^}]*\b(for|while)\s*\(.*?\))/g,
                    emoji: '🔁',
                    hover: 'Nested loops detected! - Extension'
                },
                {
                    regex: /(?<!case\s)(?<!return\s)(?<!default\s)\b\d+\b/g,
                    emoji: '🔢',
                    hover: 'Magic number detected! - Extension'
                }
            ];
            // Check for missing semicolons
            const checkMissingSemicolon = () => {
                const decorations = [];
                let isInsideBlockComment = false;
                for (let i = 0; i < editor.document.lineCount; i++) {
                    const line = editor.document.lineAt(i);
                    const lineText = line.text.trim();
                    // Handle block comment detection
                    if (lineText.startsWith('/*')) {
                        isInsideBlockComment = true;
                    }
                    if (lineText === '' ||
                        lineText.startsWith('//') ||
                        isInsideBlockComment ||
                        lineText.match(/(if|for|while|switch|return|#include|#define|namespace|class|struct|try|catch)\b/) ||
                        lineText.endsWith('{') ||
                        lineText.endsWith('}')) {
                        // Check for end of block comment
                        if (lineText.includes('*/')) {
                            isInsideBlockComment = false;
                        }
                        continue;
                    }
                    if (!lineText.endsWith(';') &&
                        !lineText.endsWith(')') &&
                        !lineText.match(/[=+\-*\/&|]\s*$/)) {
                        decorations.push({
                            range: new vscode.Range(line.range.end, line.range.end),
                            renderOptions: {
                                after: {
                                    contentText: ' ❌',
                                    margin: '0 0 0 10px',
                                    color: 'red'
                                }
                            },
                            hoverMessage: 'Missing semicolon at end of statement! - Extension'
                        });
                    }
                }
                return decorations;
            };
            // Check for trailing whitespace
            const checkTrailingWhitespace = () => {
                const decorations = [];
                let isInsideBlockComment = false;
                for (let i = 0; i < editor.document.lineCount; i++) {
                    const line = editor.document.lineAt(i);
                    const lineText = line.text;
                    // Check if we're entering a block comment
                    if (lineText.startsWith('/*')) {
                        isInsideBlockComment = true;
                    }
                    // Skip empty lines, single-line comments, and block comments
                    if (lineText === '' ||
                        lineText.startsWith('//') ||
                        isInsideBlockComment) {
                        // Check if we're exiting a block comment
                        if (lineText.includes('*/')) {
                            isInsideBlockComment = false;
                        }
                        continue;
                    }
                    if (lineText.trim().length > 0 && lineText.match(/\s+$/)) {
                        decorations.push({
                            range: new vscode.Range(line.range.end, line.range.end),
                            renderOptions: {
                                after: {
                                    contentText: ' ⚠️',
                                    margin: '0 0 0 10px',
                                    color: 'orange'
                                }
                            },
                            hoverMessage: 'Trailing whitespace detected! - Extension'
                        });
                    }
                }
                return decorations;
            };
            // Process code patterns
            const emojiMatches = new Map();
            // emojiPatterns.forEach(({ regex, emoji, hover, minCount = 1 }) => {
            //     const matches = [...text.matchAll(regex)];
            //     if (matches.length >= minCount) {
            //         matches.forEach(match => {
            //             const lineNumber = editor.document.positionAt(match.index!).line;
            //             if (!emojiMatches.has(lineNumber)) {
            //                 emojiMatches.set(lineNumber, { emojis: new Set(), hovers: new Set() });
            //             }
            //             emojiMatches.get(lineNumber)!.emojis.add(emoji);
            //             emojiMatches.get(lineNumber)!.hovers.add(hover);
            //         });
            //     }
            // });
            emojiPatterns.forEach(({ regex, emoji, hover, minCount = 1 }) => {
                const matches = [...cleanedText.matchAll(regex)];
                if (matches.length >= minCount) {
                    matches.forEach(match => {
                        // Find position in original document
                        const originalPosition = originalText.indexOf(match[0]);
                        if (originalPosition >= 0) {
                            const lineNumber = editor.document.positionAt(originalPosition).line;
                            if (!emojiMatches.has(lineNumber)) {
                                emojiMatches.set(lineNumber, {
                                    emojis: new Set(),
                                    hovers: new Set()
                                });
                            }
                            emojiMatches.get(lineNumber).emojis.add(emoji);
                            emojiMatches.get(lineNumber).hovers.add(hover);
                        }
                    });
                }
            });
            // Add emoji decorations
            emojiMatches.forEach((value, lineNumber) => {
                const line = editor.document.lineAt(lineNumber);
                decorationOptions.push({
                    range: new vscode.Range(line.range.end, line.range.end),
                    renderOptions: {
                        after: {
                            contentText: ` ${Array.from(value.emojis).join(' ')}`,
                            margin: '0 0 0 10px'
                        }
                    },
                    hoverMessage: Array.from(value.hovers).join('\n')
                });
            });
            // Add all diagnostic decorations
            decorationOptions.push(...checkMissingSemicolon(), ...checkTrailingWhitespace());
            editor.setDecorations(decorationType, []); // clear old
            editor.setDecorations(decorationType, decorationOptions);
        });
    });
    context.subscriptions.push({
        dispose: () => decorationType.dispose()
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map