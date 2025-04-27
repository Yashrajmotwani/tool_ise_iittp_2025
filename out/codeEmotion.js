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
            // Add an exception for "case" labels, as they don't require semicolons
            if (lineText.startsWith('case') || lineText.startsWith('default')) {
                const codeAfterLabel = lineText.substring(lineText.indexOf(':') + 1).trim();
                // Skip the line only if there's no code after the case/default label
                if (codeAfterLabel === '') {
                    continue;
                }
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
    reset() {
        this.hasShownWarning = false;
        vscode.window.showInformationMessage('CodeEmotion has been reset.');
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
        console.log(cleanedText);
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
            },
            {
                regex: /\b(?:if|for|while)\b\s*\([^)]*\)\s*\{/g,
                emoji: '🌟',
                hover: 'Well-Structured Control Flow. Follows clean syntax best practices and Clear scope definition - Extension',
                minCount: 1
            },
            {
                regex: /\b(?:return|break|continue)\b/g,
                emoji: '⚡',
                hover: 'Great! Improving Performance and Reducing unnecessary iterations - Extension',
                minCount: 1
            },
            {
                regex: /\bvoid\s+\w+\s*\([^)]*\)\s*\{/g,
                emoji: '👍',
                hover: 'Good void function design! - Extension',
                minCount: 1
            },
            {
                regex: /\b(?:TEST|TEST_F)\b\s*\([^)]*\)/g,
                emoji: '🧪',
                hover: 'Wow! Google Test macro detected. Tip: Keep tests focused. - Extension'
            },
            {
                regex: /\b(?:ASSERT_|EXPECT_)[A-Z]+\([^)]*\)/g,
                emoji: '✅',
                hover: 'Great! Google Test assertion. Tip: Use EXPECT_ for non-fatal failures, ASSERT_ for fatal ones.'
            },
            {
                regex: /\btry\s*\{[^}]*catch\s*\(/g,
                emoji: '🛡️',
                hover: "Proper error handling! Remember: Log errors with context. - Extension"
            },
            {
                regex: /const\s+\w+\s*=\s*\d+/g,
                emoji: '🔮',
                hover: "Perfect! Magic number replaced with constant! - Extension"
            },
            {
                regex: /`[^`]*\$\{[^}]+\}[^`]*`/g,
                emoji: '🧵',
                hover: "Template literals beat string concatenation! - Extension"
            },
            {
                regex: /\(\s*\*\s*\w+\s*\)\s*\([^)]*\)/g,
                emoji: '🏹',
                hover: "Good: Function pointer usage in C/C++. Tip: Use typedef for complex cases."
            },
            {
                regex: /(?:beforeEach|afterEach|describe|it)\(/g,
                emoji: '🧪',
                hover: "Test helpers = maintainable suites! Group related tests. - Extension"
            },
            {
                regex: /\[\]([^)]*)\s*\{/g,
                emoji: 'λ',
                hover: "Modern C++: Lambda detected. Tip: Use captures like `[&]` carefully!"
            },
            {
                regex: /\b(?:unique|shared|weak)_ptr\s*</g,
                emoji: '🧠',
                hover: "Modern C++: Smart pointer usage avoids manual memory leaks."
            },
            {
                regex: /\bTEST_CASE\b\s*\([^)]*\)/g,
                emoji: '🧪',
                hover: 'Catch2 test. Tip: Use sections to organize related cases. - Extension'
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
                hoverMessage: Array.from(value.hovers).join('   \n')
            });
        });
        // Process comment emojis separately
        const decoratedLines = new Set();
        let insideMultilineComment = false;
        // Match both single-line (//) and multiline (/* */) comments
        const commentMatches = [...originalText.matchAll(/\/\/[^\n]+|\/\*[\s\S]*?\*\//g)];
        commentMatches.forEach(match => {
            const matchText = match[0];
            const matchStart = originalText.indexOf(matchText);
            const matchEnd = matchStart + matchText.length;
            // Check if the match is inside a multi-line comment block
            if (matchText.startsWith('/*')) {
                insideMultilineComment = true; // We're inside a block comment
            }
            if (matchText.endsWith('*/')) {
                insideMultilineComment = false; // End of block comment
            }
            // Skip decoration if inside a multi-line comment block
            if (insideMultilineComment) {
                return;
            }
            // Only process single-line comments (//)
            if (matchText.startsWith('//')) {
                const lineNumber = editor.document.positionAt(matchStart).line;
                // Skip this line if it has already been decorated
                if (decoratedLines.has(lineNumber)) {
                    return;
                }
                // Add decoration for the comment line
                decorationOptions.push({
                    range: new vscode.Range(editor.document.positionAt(matchStart), editor.document.positionAt(matchEnd)),
                    renderOptions: {
                        after: {
                            contentText: ' 📝',
                            margin: '0 0 0 10px',
                            color: 'gray' // Optional: Adjust color as needed
                        }
                    },
                    hoverMessage: "Documentation: Clear comment! Tip: Update comments when code changes. - Extension"
                });
                // Mark the line as decorated
                decoratedLines.add(lineNumber);
            }
        });
        // Add all diagnostic decorations
        decorationOptions.push(...this.checkMissingSemicolon(editor), ...this.checkTrailingWhitespace(editor));
        editor.setDecorations(this.decorationType, []); // clear old
        editor.setDecorations(this.decorationType, decorationOptions);
    }
}
exports.CodeEmotion = CodeEmotion;
//# sourceMappingURL=codeEmotion.js.map