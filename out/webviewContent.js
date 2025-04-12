"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = getWebviewContent;
exports.getRefactorHTMLContent = getRefactorHTMLContent;
exports.getRefactorHTMLContent2 = getRefactorHTMLContent2;
function getWebviewContent(fileName) {
    return `
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
                <div class="stat-value" id="completed-tasks">0</div>
                <div class="stat-label">Tasks Completed</div>
            </div>
        </div>
        
        <div class="section">
            <h2><span class="emoji">📋</span> Pre-Review Checklist</h2>
            <ul class="task-list" id="pre-review-tasks">
                <li class="task-item" data-task="refactor">
                    <label>Check for refactoring opportunities</label>
                    <button class="btn" onclick="checkRefactor()">
                        <span class="emoji">🔍</span> Analyze Code
                    </button>
                </li>
                <li class="task-item" data-task="tests">
                    <label>Check Code Time Complexity</label>
                    <button class="btn btn-outline" onclick="completeTask('tests')">
                        <span class="emoji">✅</span> Mark Complete
                    </button>
                </li>
                <li class="task-item" data-task="formatting">
                    <label>Generate Code Complexity Report</label>
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

            document.getElementById('completed-tasks').textContent = completedTasks;
            
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
                document.getElementById('function-count').textContent = message.content.functionCount;
                
                // Scroll to the refactor section
                section.scrollIntoView({ behavior: 'smooth' });

                // Safely update function count if provided
                if (message.content.functionCount !== undefined) {
                    document.getElementById('function-count').textContent = message.content.functionCount;
                }
                
            }
        });
    </script>
</body>
</html>
`;
}
// Refactoring rules
const refactorRules = [
    {
        key: 'long-function',
        desc: 'Function is too long. Break into smaller functions.',
        pattern: (code) => code.split(/\n/).length > 30,
        links: [
            'https://refactoring.guru/extract-method',
            'https://dev.to/tkarropoulos/extract-method-refactoring-gn5'
        ]
    },
    {
        key: 'nested-loops',
        desc: 'Multiple nested loops detected. Consider simplifying or refactoring.',
        pattern: (code) => (code.match(/for\s*\(.*\)/g) || []).length >= 2,
        links: ['https://juliuskoronci.medium.com/the-evil-nested-for-loop-9fbc2f999ec1']
    },
    {
        key: 'magic-numbers',
        desc: 'Magic numbers found. Replace them with named constants.',
        pattern: (code) => /[^\w](\d{2,}|[1-9])[^\w]/.test(code),
        links: [
            'https://en.wikipedia.org/wiki/Magic_number_(programming)',
            'https://refactoring.guru/replace-magic-number-with-symbolic-constant'
        ]
    },
    {
        key: 'duplicate-code',
        desc: 'Possible duplicate lines. Consider extracting common logic.',
        pattern: (code) => {
            const lines = code.split(/\n/).map(line => line.trim()).filter(l => l.length > 10);
            const duplicates = lines.filter((line, idx) => lines.indexOf(line) !== idx);
            return duplicates.length > 0;
        },
        links: [
            'https://www.codeant.ai/blogs/refactor-duplicate-code-examples',
            'https://refactoring.guru/smells/duplicate-code'
        ]
    },
    {
        key: 'long-parameter-list',
        desc: 'Function has too many parameters. Consider grouping them.',
        pattern: (code) => /\(.*?,.*?,.*?,.*?,/.test(code),
        links: [
            'https://stackoverflow.com/questions/439574/whats-the-best-way-to-refactor-a-method-that-has-too-many-6-parameters',
            'https://codesignal.com/learn/courses/refactoring-by-leveraging-your-tests-with-csharp-xunit/lessons/long-parameter-list-introduce-parameter-object'
        ]
    },
    {
        key: 'deep-nesting',
        desc: 'Deeply nested code blocks found. Try flattening logic.',
        pattern: (code) => code.split('{').length - code.split('}').length >= 5,
        links: [
            'https://shuhanmirza.medium.com/two-simple-methods-to-refactor-deeply-nested-code-78eb302bb0b4'
        ]
    },
    {
        key: 'temp-variable',
        desc: 'Temporary variable used only once. Consider replacing with expression.',
        pattern: (code) => /(?:int|float|double|auto)\s+\w+\s*=.*;/.test(code),
        links: [
            'https://wiki.c2.com/?ReplaceTempWithQuery',
            'https://refactoring.guru/replace-temp-with-query'
        ]
    }
];
function getRefactorHTMLContent(functions) {
    let refactorHTML = '';
    let totalIssues = 0;
    const functionIssues = {};
    functions.forEach(func => {
        const detectedIssues = refactorRules
            .filter(rule => rule.pattern(func.body))
            .map(rule => rule.desc);
        if (detectedIssues.length > 0) {
            functionIssues[func.name] = {
                issues: detectedIssues,
                links: detectedIssues.map(desc => refactorRules.find(r => r.desc === desc)?.links[0] || '#')
            };
            totalIssues += detectedIssues.length;
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
            refactorHTML += `
            <li class="issue-item">
                <div class="issue-title">
                    ${issue} <!-- Removed emoji span -->
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
    return {
        html: refactorHTML,
        issueCount: totalIssues,
    };
}
function getRefactorHTMLContent2(functions, issueDefinitions, emojiMap) {
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
    return {
        html: refactorHTML,
        issueCount: totalIssues
    };
}
//# sourceMappingURL=webviewContent.js.map