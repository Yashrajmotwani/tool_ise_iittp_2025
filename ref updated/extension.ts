import * as vscode from 'vscode';

// ---------------- Refactoring Rules ------------------
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
		links: [
			'https://juliuskoronci.medium.com/the-evil-nested-for-loop-9fbc2f999ec1'
		]
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
			'https://shuhanmirza.medium.com/two-simple-methods-to-refactor-deeply-nested-code-78eb302bb0b4#:~:text=Deeply%20nested%20code%20can%20often,them%20into%20their%20own%20functions.'

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

// ------------- Analyze Code ----------------------
function analyzeCppCode(code: string): { key: string; desc: string; links: string[] }[] {
	return refactorRules.filter(rule => rule.pattern(code));
}

// ------------- Webview Generator ----------------------
function generateHtml(issues: { key: string; desc: string; links: string[] }[]): string {
	if (issues.length === 0) {
		return `<h2 style="color:green;">No major refactoring issues detected. 🎉</h2>`;
	}

	return `
    <h2 style="color:#D7263D">⚠️ Refactoring Suggestions</h2>
    <ul>
      ${issues.map(issue => `
        <li style="margin-bottom: 10px;">
          <strong>${issue.desc}</strong><br />
          ${issue.links.map(link => `<a href="${link}" target="_blank">🔗 Learn More</a>`).join(' | ')}
        </li>`).join('')}
    </ul>
  `;
}

// ------------- Main Activation ----------------------
export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('cppRefactorHelper.analyzeFunction', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor.');
			return;
		}

		const languageId = editor.document.languageId;
		const fileName = editor.document.fileName;

		if (!['cpp', 'c', 'cc', 'cxx'].includes(languageId) && !fileName.endsWith('.cpp')) {
			vscode.window.showWarningMessage('This tool is intended for C++ code only.');
			return;
		}

		const code = editor.selection.isEmpty ? editor.document.getText() : editor.document.getText(editor.selection);
		const issues = analyzeCppCode(code);

		const panel = vscode.window.createWebviewPanel(
			'refactorSuggestions',
			'C++ Refactor Insights',
			vscode.ViewColumn.Beside,
			{ enableScripts: true }
		);

		panel.webview.html = `
      <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          ul { list-style-type: disc; }
          a { color: #007ACC; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${generateHtml(issues)}
      </body>
      </html>
    `;
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
