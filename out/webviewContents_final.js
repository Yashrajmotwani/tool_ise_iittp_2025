"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebviewContent = getWebviewContent;
exports.getRefactorHTMLContent = getRefactorHTMLContent;
exports.analyzeCodeForRefactoring = analyzeCodeForRefactoring;
// ---------------- Refactoring Rules ------------------
const refactorRules = [
    {
        key: 'long-function',
        desc: 'Function is too long (>30 lines). Break into smaller functions.',
        emoji: '📏',
        pattern: (code) => code.split(/\n/).length > 30,
        links: [
            'https://refactoring.guru/extract-method',
            'https://dev.to/tkarropoulos/extract-method-refactoring-gn5'
        ]
    },
    {
        key: 'nested-loops',
        desc: 'Nested loops detected. Consider simplifying.',
        emoji: '🔁',
        pattern: (code) => (code.match(/for\s*\(.*\)/g) || []).length >= 2,
        links: [
            'https://juliuskoronci.medium.com/the-evil-nested-for-loop-9fbc2f999ec1'
        ]
    },
    {
        key: 'magic-numbers',
        desc: 'Magic numbers found. Use named constants.',
        emoji: '🔢',
        pattern: (code) => /[^\w](\d{2,}|[1-9])[^\w]/.test(code),
        links: [
            'https://en.wikipedia.org/wiki/Magic_number_(programming)',
            'https://refactoring.guru/replace-magic-number-with-symbolic-constant'
        ]
    },
    {
        key: 'duplicate-code',
        desc: 'Duplicate code detected. Extract common logic.',
        emoji: '♻️',
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
        desc: 'Too many parameters (>4). Consider grouping them.',
        emoji: '📦',
        pattern: (code) => /\(.*?,.*?,.*?,.*?,/.test(code),
        links: [
            'https://stackoverflow.com/questions/439574/whats-the-best-way-to-refactor-a-method-that-has-too-many-6-parameters',
            'https://codesignal.com/learn/courses/refactoring-by-leveraging-your-tests-with-csharp-xunit/lessons/long-parameter-list-introduce-parameter-object'
        ]
    },
    {
        key: 'deep-nesting',
        desc: 'Deeply nested code (>5 levels). Try flattening logic.',
        emoji: '🔄',
        pattern: (code) => code.split('{').length - code.split('}').length >= 5,
        links: [
            'https://shuhanmirza.medium.com/two-simple-methods-to-refactor-deeply-nested-code-78eb302bb0b4'
        ]
    },
    {
        key: 'temp-variable',
        desc: 'Temporary variable used once. Replace with expression.',
        emoji: '⏱️',
        pattern: (code) => /(?:int|float|double|auto)\s+\w+\s*=.*;/.test(code),
        links: [
            'https://wiki.c2.com/?ReplaceTempWithQuery',
            'https://refactoring.guru/replace-temp-with-query'
        ]
    },
    // Legacy rules from original implementation
    {
        key: 'many-if',
        desc: 'Too many if-else statements (>3). Consider polymorphism.',
        emoji: '💩',
        pattern: (code) => (code.match(/\bif\s*\(.*\)\s*\{/g) || []).length > 3,
        links: [
            'https://refactoring.guru/replace-conditional-with-polymorphism'
        ]
    },
    {
        key: 'large-switch',
        desc: 'Large switch statement (>3 cases). Consider state pattern.',
        emoji: '🌀',
        pattern: (code) => (code.match(/\bswitch\s*\(.*?\)\s*\{[^}]*case[^}]*case[^}]*case/g) || []).length > 0,
        links: [
            'https://refactoring.guru/design-patterns/state'
        ]
    }
];
function getWebviewContent(fileName, functionCount) {
    return `<!DOCTYPE html>
<html lang="en">
<!-- Keep your existing HTML/CSS structure exactly as is -->
<!-- ... -->
</html>`;
}
function getRefactorHTMLContent(functions, issueDefinitions, emojiMap) {
    let refactorHTML = '';
    let totalIssues = 0;
    const allIssues = [];
    // Analyze each function with both old and new rules
    functions.forEach(func => {
        const issues = refactorRules
            .filter(rule => rule.pattern(func.body))
            .map(rule => ({
            desc: rule.desc,
            links: rule.links,
            emoji: rule.emoji
        }));
        if (issues.length > 0) {
            allIssues.push({
                name: func.name,
                issues: issues
            });
            totalIssues += issues.length;
        }
    });
    // Generate HTML for each function with issues
    allIssues.forEach(func => {
        refactorHTML += `
        <div class="function-card">
            <div class="function-name">
                <span class="emoji">🧩</span> ${func.name}
                <span class="status-badge badge-error">${func.issues.length} issues</span>
            </div>
            <ul class="issue-list">`;
        func.issues.forEach(issue => {
            refactorHTML += `
            <li class="issue-item">
                <div class="issue-title">
                    <span class="issue-icon emoji">${issue.emoji}</span> 
                    ${issue.desc}
                </div>
                <div class="issue-solution">
                    <strong>Solution:</strong> 
                    ${issue.links.map(link => `
                    <a class="refactor-link" href="${link}" target="_blank">
                        Learn more
                        <span class="emoji">🔗</span>
                    </a>`).join(' | ')}
                </div>
            </li>`;
        });
        refactorHTML += `</ul></div>`;
    });
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
        functionCount: functions.length
    };
}
// Utility function for the new refactoring analysis
function analyzeCodeForRefactoring(code) {
    return refactorRules
        .filter(rule => rule.pattern(code))
        .map(rule => ({
        desc: `${rule.emoji} ${rule.desc}`,
        links: rule.links
    }));
}
//# sourceMappingURL=webviewContents_final.js.map