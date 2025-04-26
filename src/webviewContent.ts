import * as vscode from 'vscode';

export function getWebviewContent(fileName: string) {
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
            display: none !important;
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

        // In your getWebviewContent function, add these styles
        .complexity-summary {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .complexity-stats {
            display: flex;
            gap: 15px;
        }

        .complexity-item {
            background: var(--card-bg);
            border-radius: 6px;
            padding: 12px 15px;
            margin-bottom: 10px;
            position: relative;
            overflow: hidden;
        }

        .complexity-bar {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            opacity: 0.2;
        }

        .complexity-details {
            position: relative;
            display: flex;
            justify-content: space-between;
        }

        .complexity-name {
            font-weight: bold;
            flex: 2;
        }

        .complexity-score {
            flex: 1;
            text-align: center;
        }

        .complexity-lines {
            flex: 1;
            text-align: right;
            color: var(--text-secondary);
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
        
        <div class="summary-stats" style="justify-content: space-between; align-items: center;">
            <div class="stat-card">
                <div class="stat-value" id="completed-tasks">0</div>
                <div class="stat-label">Tasks Completed</div>
            </div>
            <button id="refresh-btn" class="stat-card" style="background-color: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                <div class="stat-value">🔄 Refresh Tasks</div>
            </button>

        </div>

        
        <div class="section">
            <h2><span class="emoji">📋</span> Pre-Review Checklist</h2>
            <ul class="task-list" id="pre-review-tasks">
                <li class="task-item" data-task="refactor">
                    <label>Check for refactoring opportunities</label>
                    <div style="display: flex; gap: 10px; margin-top: 6px;">
                        <button class="btn" onclick="checkRefactor()">
                            <span class="emoji">🔍</span> Analyze Code
                        </button>
                        <button class="btn btn-outline" onclick="completeTask('refactor')">
                            <span class="emoji">✅</span> Mark Complete
                        </button>
                    </div>
                </li>
                <li class="task-item" data-task="complexity">
                    <label>Generate Code Complexity Report</label>
                    <div style="display: flex; gap: 10px; margin-top: 6px;">
                        <button class="btn" onclick="checkComplexity()">
                            <span class="emoji">📊</span> Analyze Complexity
                        </button>
                        <button class="btn btn-outline" onclick="completeTask('complexity')">
                                <span class="emoji">✅</span> Mark Complete
                        </button>
                    </div>
                </li>
                <li class="task-item" data-task="tests">
                    <label>Check Code Time Complexity</label>
                    <button class="btn btn-outline" onclick="completeTask('tests')">
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
        <div class="section hidden" id="complexity-section">
            <h2><span class="emoji">📊</span> Code Complexity Report</h2>
            <div id="complexity-table"></div>
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
            vscode.postMessage({ 
                command: 'resetAndShow',
                show: 'refactor'
            });
            vscode.postMessage({ 
                command: 'checkRefactor' 
            });
        }

        function checkComplexity() {
            vscode.postMessage({ 
                command: 'resetAndShow',
                show: 'complexity'
            });
            vscode.postMessage({ 
                command: 'analyzeComplexity'
            });
        }
                
        function runTests() {
            vscode.postMessage({ command: 'runTests' });
        }
        
        function checkComments() {
            vscode.postMessage({ command: 'checkComments' });
        }

        function escapeHtml(unsafe) {
            return unsafe?.toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;") || "";
        }

        function displayComplexityTable(data) {
    console.log("WEBVIEW: Received data for table:", data);

    const section = document.getElementById('complexity-section');
    console.log("WEBVIEW: Section element:", section);
    const tableContainer = document.getElementById('complexity-table');
    
    if (!data || data.length === 0) {
        console.warn("No complexity data received");
        tableContainer.innerHTML = '<p>No complexity data found</p>';
        section.classList.remove('hidden');
        section.style.display = 'block';
        return;
    }

    // Define the complexity to color mapping
    const complexityColorMap = {
        1: "#00ff00", // Bright green
        2: "#33ff00",
        3: "#66ff00",
        4: "#99ff00",
        5: "#ccff00", // Green-yellow
        6: "#eeff00",
        7: "#ffff00", // Yellow
        8: "#ffdd00",
        9: "#ffbb00",
        10: "#ff9900", // Orange
        11: "#ff7700",
        12: "#ff5500",
        13: "#ff3300",
        14: "#ff2200",
        15: "#ff1100",
        16: "#ff0000", // Red
        17: "#e60000",
        18: "#cc0000",
        19: "#b30000",
        20: "#990000",
        21: "#800000",
        22: "#660000",
        23: "#4d0000",
        24: "#330000",
        25: "#1a0000"  // Dark maroon
    };

    // Create a button to show/hide the color mapping
    const colorMappingButton = document.createElement('button');
    colorMappingButton.textContent = 'Show Complexity Color Mapping';
    colorMappingButton.style.margin = '10px 0';
    colorMappingButton.style.padding = '5px 10px';
    colorMappingButton.style.cursor = 'pointer';
    
    // Create container for color mapping (initially hidden)
    const colorMappingContainer = document.createElement('div');
    colorMappingContainer.style.display = 'none';
    
    // Mapping the complexity levels to the named colors
    const namedColorMap = {
        1: 'Bright Green',
        2: 'Light Green',
        3: 'Medium Green',
        4: 'Yellow Green',
        5: 'Green-Yellow',
        6: 'Bright Yellow',
        7: 'Yellow',
        8: 'Golden Yellow',
        9: 'Light Orange',
        10: 'Orange',
        11: 'Dark Orange',
        12: 'Red-Orange',
        13: 'Bright Red',
        14: 'Light Red',
        15: 'Dark Red',
        16: 'Red',
        17: 'Deep Red',
        18: 'Very Dark Red',
        19: 'Intense Red',
        20: 'Dark Maroon',
        21: 'Maroon',
        22: 'Deep Maroon',
        23: 'Dark Brown',
        24: 'Dark Brownish Red',
        25: 'Almost Black Maroon'
    };

    // Build the color mapping table HTML
    let colorMappingHTML = 
        '<h3>Complexity and Corresponding Colors</h3>' +
        '<table style="width: 100%; border-collapse: collapse;" border="1">' +
            '<thead>' +
                '<tr>' +
                    '<th>Complexity</th>' +
                    '<th>Color</th>' +
                    '<th>Named Color</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>';

    for (const complexity in complexityColorMap) {
        const color = complexityColorMap[complexity];
        const namedColor = namedColorMap[complexity];
        
        colorMappingHTML += 
            '<tr>' +
                '<td>' + complexity + '</td>' +
                '<td style="background-color:' + color + ';">' + color + '</td>' +
                '<td>' + namedColor + '</td>' +
            '</tr>';
    }

    colorMappingHTML += '</tbody></table>';
    colorMappingContainer.innerHTML = colorMappingHTML;

    // Toggle color mapping visibility on button click
    colorMappingButton.addEventListener('click', () => {
        if (colorMappingContainer.style.display === 'none') {
            colorMappingContainer.style.display = 'block';
            colorMappingButton.textContent = 'Hide Complexity Color Mapping';
        } else {
            colorMappingContainer.style.display = 'none';
            colorMappingButton.textContent = 'Show Complexity Color Mapping';
        }
    });

    // Insert the button and container at the top of the section
    section.insertBefore(colorMappingButton, tableContainer);
    section.insertBefore(colorMappingContainer, tableContainer);

    // Render the main complexity table
    let tableHTML = 
        '<table style="width: 100%; border-collapse: collapse;" border="1">' +
            '<thead>' +
                '<tr>' +
                    '<th>Function Name</th>' +
                    '<th>Complexity</th>' +
                    '<th>Lines of Code</th>' +
                    '<th>Location</th>' +
                    '<th>Color Code</th>' +
                    '<th>Color</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>';

    data.forEach(item => {
        const color = complexityColorMap[item.complexity] || '#ffffff';

        tableHTML += 
            '<tr>' +
                '<td>' + escapeHtml(item.functionName) + '</td>' +
                '<td>' + escapeHtml(item.complexity) + '</td>' +
                '<td>' + escapeHtml(item.loc) + '</td>' +
                '<td>' + escapeHtml(item.location) + '</td>' +
                '<td>' + escapeHtml(color) + '</td>' +
                '<td style="background-color:' + escapeHtml(color) + ';">' + escapeHtml(color) + '</td>' +
            '</tr>';
    });

    tableHTML += '</tbody></table>';
    tableContainer.innerHTML = tableHTML;
    
    console.log("Main Complexity Table rendered successfully");

    // Scroll to the complexity section
    section.scrollIntoView({ behavior: 'smooth' });
}

// Helper function to escape HTML (if not already defined)
function escapeHtml(unsafe) {
    if (typeof unsafe === 'undefined') return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


            // Add event listener for refresh
document.getElementById('refresh-btn')?.addEventListener('click', () => {
    completedTasks = 0;
    document.querySelectorAll('.task-item').forEach(item => item.classList.remove('completed'));
    updateProgress();

    // Hide results at bottom
    document.getElementById('refactor-section')?.classList.add('hidden');
    document.getElementById('complexity-section')?.classList.add('hidden');

    // Notify extension backend
    vscode.postMessage({ command: 'refreshExtension' });
});



        
        window.addEventListener('message', event => {
            const message = event.data;

            if (message.command === 'resetAndShow') {
                const refactorSection = document.getElementById('refactor-section');
                const complexitySection = document.getElementById('complexity-section');

                // Hide both using classList
                refactorSection?.classList.add('hidden');
                complexitySection?.classList.add('hidden');

                // Show requested section using classList
                if (message.show === 'refactor') {
                    refactorSection.classList.remove('hidden');
                } 
                else if (message.show === 'complexity') {
                    complexitySection.classList.remove('hidden');
                }
            }

            else if (message.command === 'displayRefactor') {
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
            
            else if (message.command === 'displayComplexity') {
                console.log("WEBVIEW: Processing complexity data");
                displayComplexityTable(message.data);
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
        pattern: (code: string) => code.split(/\n/).length > 30,
        links: [
            'https://refactoring.guru/extract-method',
            'https://dev.to/tkarropoulos/extract-method-refactoring-gn5'
        ]
    },
    {
        key: 'nested-loops',
        desc: 'Multiple nested loops detected. Consider simplifying or refactoring.',
        pattern: (code: string) => (code.match(/for\s*\(.*\)/g) || []).length >= 2,
        links: ['https://juliuskoronci.medium.com/the-evil-nested-for-loop-9fbc2f999ec1']
    },
    {
        key: 'magic-numbers',
        desc: 'Magic numbers found. Replace them with named constants.',
        pattern: (code: string) => /[^\w](\d{2,}|[1-9])[^\w]/.test(code),
        links: [
            'https://en.wikipedia.org/wiki/Magic_number_(programming)',
            'https://refactoring.guru/replace-magic-number-with-symbolic-constant'
        ]
    },
    {
        key: 'duplicate-code',
        desc: 'Possible duplicate lines. Consider extracting common logic.',
        pattern: (code: string) => {
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
        pattern: (code: string) => /\(.*?,.*?,.*?,.*?,/.test(code),
        links: [
            'https://stackoverflow.com/questions/439574/whats-the-best-way-to-refactor-a-method-that-has-too-many-6-parameters',
            'https://codesignal.com/learn/courses/refactoring-by-leveraging-your-tests-with-csharp-xunit/lessons/long-parameter-list-introduce-parameter-object'
        ]
    },
    {
        key: 'deep-nesting',
        desc: 'Deeply nested code blocks found. Try flattening logic.',
        pattern: (code: string) => code.split('{').length - code.split('}').length >= 5,
        links: [
            'https://shuhanmirza.medium.com/two-simple-methods-to-refactor-deeply-nested-code-78eb302bb0b4'
        ]
    },
    {
        key: 'temp-variable',
        desc: 'Temporary variable used only once. Consider replacing with expression.',
        pattern: (code: string) => /(?:int|float|double|auto)\s+\w+\s*=.*;/.test(code),
        links: [
            'https://wiki.c2.com/?ReplaceTempWithQuery',
            'https://refactoring.guru/replace-temp-with-query'
        ]
    }
];

export function getRefactorHTMLContent(
    functions: { name: string, body: string }[],
    // issueDefinitions: Record<string, string>,
    // emojiMap: Record<string, string>
) {
    let refactorHTML = '';
    let totalIssues = 0;
    const functionIssues: Record<string, { issues: string[], links: string[] }> = {};

    functions.forEach(func => {
        const detectedIssues = refactorRules
            .filter(rule => rule.pattern(func.body))
            .map(rule => rule.desc);

        if (detectedIssues.length > 0) {
            functionIssues[func.name] = {
                issues: detectedIssues,
                links: detectedIssues.map(desc =>
                    refactorRules.find(r => r.desc === desc)?.links[0] || '#'
                )
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