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
        // 🧼 Step 1: Remove comments before regex matching
        function stripComments(code) {
            return code
                // Remove block comments: /* ... */
                .replace(/\/\*[\s\S]*?\*\//g, '')
                // Remove line comments: // ...
                .replace(/\/\/.*$/gm, '');
        }
        const cleanedText = stripComments(text);
        const functionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(?!main\b)(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
        const countFunctionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(?!if|while|for|switch\b)(\w+)\s*\(([^)]*)\)\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;
        // Get accurate function count
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
        let completedTasks = 0; // Track at module level
        const completedTaskIds = new Set(); // Track which tasks are done
        const panel = vscode.window.createWebviewPanel('refactorSuggestions', `Code Review Checklist - ${fileName}`, vscode.ViewColumn.One, { enableScripts: true });
        let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Code Review Checklist</title>
            <style>
                :root {
                    --primary-color: #007acc;
                    --secondary-color: #1e1e1e;
                    --accent-color: #3794ff;
                    --text-color: #e0e0e0;
                    --light-text: #ffffff;
                    --dark-text: #333333;
                    --success-color: #4CAF50;
                    --warning-color: #FFC107;
                    --error-color: #F44336;
                    --bg-color: #252526;
                    --card-bg: #2d2d2d;
                    --border-color: #444;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: var(--bg-color);
                    color: var(--text-color);
                    margin: 0;
                    padding: 20px;
                    line-height: 1.6;
                }
                
                .container {
                    max-width: 900px;
                    margin: 0 auto;
                }
                
                h1, h2, h3 {
                    color: var(--light-text);
                    margin-top: 0;
                }
                
                h1 {
                    font-size: 24px;
                    border-bottom: 2px solid var(--primary-color);
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                }
                
                h1 .file-name {
                    color: var(--accent-color);
                    margin-left: 10px;
                }
                
                h2 {
                    font-size: 20px;
                    margin: 25px 0 15px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .section {
                    background-color: var(--card-bg);
                    border-radius: 6px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                
                .task-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .task-item {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    margin-bottom: 8px;
                    background-color: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .task-item:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                
                .task-item label {
                    flex-grow: 1;
                    cursor: pointer;
                }
                
                .task-item.completed label {
                    text-decoration: line-through;
                    opacity: 0.7;
                }
                
                .btn {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .btn:hover {
                    background-color: var(--accent-color);
                }
                
                .btn i {
                    margin-right: 6px;
                }
                
                .btn-outline {
                    background-color: transparent;
                    border: 1px solid var(--primary-color);
                    color: var(--primary-color);
                }
                
                .btn-outline:hover {
                    background-color: rgba(0, 122, 204, 0.1);
                }
                
                .function-card {
                    background-color: var(--card-bg);
                    border-radius: 6px;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-left: 4px solid var(--primary-color);
                }
                
                .function-name {
                    font-weight: 600;
                    color: var(--accent-color);
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                }
                
                .issue-list {
                    margin-top: 10px;
                    padding-left: 20px;
                }
                
                .issue-item {
                    margin-bottom: 8px;
                    padding: 8px;
                    background-color: rgba(255, 255, 255, 0.03);
                    border-radius: 4px;
                }
                
                .issue-title {
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                }
                
                .issue-icon {
                    margin-right: 8px;
                    font-size: 1.1em;
                }
                
                .issue-solution {
                    margin-top: 5px;
                    font-size: 0.9em;
                    opacity: 0.9;
                }
                
                .refactor-link {
                    color: var(--accent-color);
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                }
                
                .refactor-link:hover {
                    text-decoration: underline;
                }
                
                .refactor-link i {
                    margin-left: 5px;
                    font-size: 0.9em;
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: 500;
                    margin-left: 10px;
                }
                
                .badge-success {
                    background-color: rgba(76, 175, 80, 0.2);
                    color: var(--success-color);
                }
                
                .badge-warning {
                    background-color: rgba(255, 193, 7, 0.2);
                    color: var(--warning-color);
                }
                
                .badge-error {
                    background-color: rgba(244, 67, 54, 0.2);
                    color: var(--error-color);
                }
                
                .hidden {
                    display: none;
                }
                
                .progress-container {
                    margin: 20px 0;
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    height: 8px;
                    overflow: hidden;
                }

                .progress-bar {
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                    background: linear-gradient(
                        90deg,
                        rgba(0, 122, 204, 1) 0%,
                        rgba(55, 148, 255, 1) 50%,
                        rgba(76, 175, 80, 1) 100%
                    );
                    background-size: 200% 100%;
                    animation: gradientShift 2s ease infinite;
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .progress-text {
                    text-align: right;
                    font-size: 0.85em;
                    margin-top: 5px;
                    color: var(--text-color);
                    opacity: 0.8;
                }
                
                .summary-stats {
                    display: flex;
                    gap: 15px;
                    margin: 15px 0;
                }
                
                .stat-card {
                    flex: 1;
                    background-color: var(--card-bg);
                    padding: 12px;
                    border-radius: 6px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 1.5em;
                    font-weight: 600;
                    margin: 5px 0;
                }
                
                .stat-label {
                    font-size: 0.85em;
                    opacity: 0.8;
                }
                
                .emoji {
                    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>
                    <span class="emoji">🔍</span> Code Review Checklist 
                    <span class="file-name">${fileName}</span>
                </h1>
                
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
                <div class="progress-text" id="progress-text">0% complete</div>
                
                <div class="summary-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="function-count">${functionCount}</div>
                        <div class="stat-label">Functions Detected</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="completed-tasks">0</div>
                        <div class="stat-label">Tasks Completed</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2><span class="emoji">📋</span> Pre-Review Checklist</h2>
                    <ul class="task-list" id="pre-review-tasks">
                        <li class="task-item" data-task="tests">
                            <label>Run all unit tests</label>
                            <button class="btn btn-outline" onclick="completeTask('tests')">
                                <span class="emoji">✅</span> Mark Complete
                            </button>
                        </li>
                        <li class="task-item" data-task="formatting">
                            <label>Format code with clang-format</label>
                            <button class="btn btn-outline" onclick="completeTask('formatting')">
                                <span class="emoji">✅</span> Mark Complete
                            </button>
                        </li>
                        <li class="task-item" data-task="comments">
                            <label>Add/update code comments</label>
                            <button class="btn btn-outline" onclick="completeTask('comments')">
                                <span class="emoji">✅</span> Mark Complete
                            </button>
                        </li>
                        <li class="task-item" data-task="refactor">
                            <label>Check for refactoring opportunities</label>
                            <button class="btn" onclick="checkRefactor()">
                                <span class="emoji">🔍</span> Analyze Code
                            </button>
                        </li>
                    </ul>
                </div>
                
                <div class="section hidden" id="refactor-section">
                    <h2><span class="emoji">🔧</span> Refactoring Recommendations</h2>
                    <div id="refactor-summary"></div>
                    <div id="refactor-list"></div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let completedTasks = 0;
                const totalTasks = 4; // Total number of checklist items
                
                function updateProgress() {
                    const progress = Math.round((completedTasks / totalTasks) * 100);
                    const progressBar = document.getElementById('progress-bar');
                    
                    progressBar.style.width = progress + '%';
                    document.getElementById('progress-text').textContent = progress + '% complete';
                    
                    // Remove animation when complete
                    if (progress === 100) {
                        progressBar.style.animation = 'none';
                        progressBar.style.background = 'var(--success-color)';
                    }
                }
                
                function completeTask(taskId) {
                    const taskItem = document.querySelector('.task-item[data-task="' + taskId + '"]');
                    if (!taskItem.classList.contains('completed')) {
                        taskItem.classList.add('completed');
                        completedTasks++;
                        updateProgress();
                        vscode.postMessage({ command: 'completeTask', task: taskId });
                    }
                }
                
                function checkRefactor() {
                    completeTask('refactor');
                    vscode.postMessage({ command: 'checkRefactor' });
                }
                
                function runTests() {
                    vscode.postMessage({ command: 'runTests' });
                }
                
                function checkFormatting() {
                    vscode.postMessage({ command: 'checkFormatting' });
                }
                
                function checkComments() {
                    vscode.postMessage({ command: 'checkComments' });
                }
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'displayRefactor') {
                        const section = document.getElementById('refactor-section');
                        const list = document.getElementById('refactor-list');
                        const summary = document.getElementById('refactor-summary');
                        
                        section.classList.remove('hidden');
                        list.innerHTML = message.content.html;
                        document.getElementById('issue-count').textContent = message.content.issueCount;
                        
                        // Scroll to the refactor section
                        section.scrollIntoView({ behavior: 'smooth' });
                        
                        // Update summary
                        if (message.content.issueCount > 0) {
                            summary.innerHTML = \`
                                <div class="issue-item" style="background-color: rgba(244, 67, 54, 0.1);">
                                    <div class="issue-title">
                                        <span class="emoji">⚠️</span> 
                                        Found \${message.content.issueCount} potential issues in your code
                                    </div>
                                    <div class="issue-solution">
                                        Review the recommendations below and consider refactoring for better code quality.
                                    </div>
                                </div>
                            \`;
                        } else {
                            summary.innerHTML = \`
                                <div class="issue-item" style="background-color: rgba(76, 175, 80, 0.1);">
                                    <div class="issue-title">
                                        <span class="emoji">🎉</span> 
                                        No major issues found!
                                    </div>
                                    <div class="issue-solution">
                                        Your code looks clean. Keep up the good work!
                                    </div>
                                </div>
                            \`;
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;
        panel.webview.html = htmlContent;
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'checkRefactor':
                    let refactorHTML = '';
                    let functionIssues = {};
                    let totalIssues = 0;
                    functions.forEach(func => {
                        const functionName = func.name;
                        const body = func.body;
                        const detectedIssues = new Set();
                        if ((body.match(/\bif\s*\(.*\)\s*\{/g) || []).length > 3) {
                            detectedIssues.add("Too many if-else statements! Consider using polymorphism.");
                        }
                        if ((body.match(/\bswitch\s*\(.*?\)\s*\{[^}]*case[^}]*case[^}]*case/g) || []).length > 0) {
                            detectedIssues.add("Large switch detected! Consider using the state pattern.");
                        }
                        if ((body.match(/\b(for|while)\s*\(.*?\)\s*\{[^}]*\b(for|while)\s*\(.*?\)/g) || []).length > 0) {
                            detectedIssues.add("Nested loops detected! Try early return or breaking into smaller functions.");
                        }
                        if ((func.body.match(/,/g) || []).length > 4) {
                            detectedIssues.add("Too many parameters! Consider encapsulating them into an object.");
                        }
                        const magicNumberPattern = /\b(?!case\s+)(?!return\s+)(?!default\s+)(\d+)\b/g;
                        if ((body.match(magicNumberPattern) || []).length > 0) {
                            detectedIssues.add("Magic numbers detected! Use named constants.");
                        }
                        if (detectedIssues.size > 0) {
                            functionIssues[functionName] = {
                                issues: Array.from(detectedIssues),
                                links: Array.from(detectedIssues).map(issue => issueDefinitions[issue])
                            };
                            totalIssues += detectedIssues.size;
                        }
                    });
                    for (const [funcName, data] of Object.entries(functionIssues)) {
                        refactorHTML += `
                            <div class="function-card">
                                <div class="function-name">
                                    <span class="emoji">🧩</span> ${funcName}
                                    <span class="status-badge badge-error">${data.issues.length} issues</span>
                                </div>
                                <ul class="issue-list">`;
                        data.issues.forEach((issue, index) => {
                            const emoji = emojiMap[issue] || '⚠️';
                            refactorHTML += `
                                <li class="issue-item">
                                    <div class="issue-title">
                                        <span class="issue-icon emoji">${emoji}</span> 
                                        ${issue}
                                    </div>
                                    <div class="issue-solution">
                                        <strong>Solution:</strong> 
                                        <a class="refactor-link" href="${data.links[index]}" target="_blank">
                                            Learn more about this refactoring
                                            <span class="emoji">🔗</span>
                                        </a>
                                    </div>
                                </li>`;
                        });
                        refactorHTML += `</ul></div>`;
                    }
                    if (refactorHTML === '') {
                        refactorHTML = `
                            <div class="function-card">
                                <div class="function-name">
                                    <span class="emoji">🎉</span> No issues detected
                                </div>
                                <p>Great job! No major code smells detected in your functions.</p>
                            </div>`;
                    }
                    panel.webview.postMessage({
                        command: 'displayRefactor',
                        content: {
                            html: refactorHTML,
                            issueCount: totalIssues
                        }
                    });
                    break;
                case 'completeTask':
                    vscode.window.showInformationMessage(`Task completed: ${message.task}`);
                    break;
                case 'runTests':
                    vscode.window.showInformationMessage('Running tests...');
                    break;
                case 'checkFormatting':
                    vscode.window.showInformationMessage('Checking code formatting...');
                    break;
                case 'checkComments':
                    vscode.window.showInformationMessage('Checking code comments...');
                    break;
            }
        }, undefined, context.subscriptions);
        context.subscriptions.push(disposable);
        // emoji decorations
        // let decorationType = vscode.window.createTextEditorDecorationType({});
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document)
                return;
            const text = editor.document.getText();
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
                for (let i = 0; i < editor.document.lineCount; i++) {
                    const line = editor.document.lineAt(i);
                    const lineText = line.text.trim();
                    if (lineText === '' ||
                        lineText.startsWith('//') ||
                        lineText.startsWith('/*') ||
                        lineText.match(/(if|for|while|switch|return|#include|#define|namespace|class|struct|try|catch)\b/) ||
                        lineText.endsWith('{') ||
                        lineText.endsWith('}')) {
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
                for (let i = 0; i < editor.document.lineCount; i++) {
                    const line = editor.document.lineAt(i);
                    const lineText = line.text;
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
            emojiPatterns.forEach(({ regex, emoji, hover, minCount = 1 }) => {
                const matches = [...text.matchAll(regex)];
                if (matches.length >= minCount) {
                    matches.forEach(match => {
                        const lineNumber = editor.document.positionAt(match.index).line;
                        if (!emojiMatches.has(lineNumber)) {
                            emojiMatches.set(lineNumber, { emojis: new Set(), hovers: new Set() });
                        }
                        emojiMatches.get(lineNumber).emojis.add(emoji);
                        emojiMatches.get(lineNumber).hovers.add(hover);
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