// codeEmotion.ts
import * as vscode from 'vscode';

export class CodeEmotion {
    private decorationType: vscode.TextEditorDecorationType;
    private hasShownWarning = false;

    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({});
    }

    public dispose() {
        this.decorationType.dispose();
    }

    private isCppFile(editor: vscode.TextEditor): boolean {
        const languageId = editor.document.languageId;
        return languageId === 'c' || languageId === 'cpp';
    }

    private stripComments(code: string): string {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
    }

    private checkMissingSemicolon(editor: vscode.TextEditor): vscode.DecorationOptions[] {
        const decorations: vscode.DecorationOptions[] = [];
        if (!this.isCppFile(editor)) {
            return decorations;
        }

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
    }

    private checkTrailingWhitespace(editor: vscode.TextEditor): vscode.DecorationOptions[] {
        const decorations: vscode.DecorationOptions[] = [];
        if (!this.isCppFile(editor)) {
            return decorations;
        }

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
    }

    public updateEmojiDecorations(editor: vscode.TextEditor, fileName: string) {
        if (!this.isCppFile(editor)) {
            editor.setDecorations(this.decorationType, []);
            if (!this.hasShownWarning) {
                vscode.window.showWarningMessage(
                    `Code Emotion emojis are disabled for "${fileName}" - only C/C++ files are supported.`,
                    "OK"
                );
                this.hasShownWarning = true;
            }
            return;
        }

        const originalText = editor.document.getText();
        const cleanedText = this.stripComments(originalText);
        
        const decorationOptions: vscode.DecorationOptions[] = [];

        // Code pattern emojis
        const emojiPatterns: { regex: RegExp, emoji: string, hover: string, minCount?: number }[] = [
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

        // Process code patterns
        const emojiMatches: Map<number, {emojis: Set<string>, hovers: Set<string>}> = new Map();

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
                        emojiMatches.get(lineNumber)!.emojis.add(emoji);
                        emojiMatches.get(lineNumber)!.hovers.add(hover);
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
        decorationOptions.push(
            ...this.checkMissingSemicolon(editor),
            ...this.checkTrailingWhitespace(editor)
        );

        editor.setDecorations(this.decorationType, []); // clear old
        editor.setDecorations(this.decorationType, decorationOptions);
    }
}