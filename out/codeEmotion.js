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
exports.CodeEmotion = void 0;
// codeEmotion.ts
const vscode = __importStar(require("vscode"));
class CodeEmotion {
    decorationType;
    hasShownWarning = false;
    constructor() {
        this.decorationType = vscode.window.createTextEditorDecorationType({});
    }
    dispose() {
        this.decorationType.dispose();
    }
    isCppFile(editor) {
        const languageId = editor.document.languageId;
        return languageId === 'c' || languageId === 'cpp';
    }
    stripComments(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
    }
    checkMissingSemicolon(editor) {
        const decorations = [];
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
    checkTrailingWhitespace(editor) {
        const decorations = [];
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
    updateEmojiDecorations(editor, fileName) {
        if (!this.isCppFile(editor)) {
            editor.setDecorations(this.decorationType, []);
            if (!this.hasShownWarning) {
                vscode.window.showWarningMessage(`Code Emotion emojis are disabled for "${fileName}" - only C/C++ files are supported.`, "OK");
                this.hasShownWarning = true;
            }
            return;
        }
        const originalText = editor.document.getText();
        const cleanedText = this.stripComments(originalText);
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
        // Process code patterns
        const emojiMatches = new Map();
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
        decorationOptions.push(...this.checkMissingSemicolon(editor), ...this.checkTrailingWhitespace(editor));
        editor.setDecorations(this.decorationType, []); // clear old
        editor.setDecorations(this.decorationType, decorationOptions);
    }
}
exports.CodeEmotion = CodeEmotion;
//# sourceMappingURL=codeEmotion.js.map