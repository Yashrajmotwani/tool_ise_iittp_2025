import * as vscode from 'vscode';

const refactorLinks: { [key: string]: { desc: string; links: string[] } } = {
	'extract-method': {
		desc: 'Function is too long or does multiple things. Split into smaller methods.',
		links: [
			'https://refactoring.guru/extract-method',
			'https://learn.microsoft.com/en-us/visualstudio/ide/refactoring-extract-method',
			'https://en.wikipedia.org/wiki/Extract_method'
		]
	},
	'replace-temp': {
		desc: 'Temporary variable used just once. Replace it with a query (function call).',
		links: [
			'https://refactoring.guru/replace-temp-with-query',
			'https://medium.com/swlh/replace-temp-with-query-d9ac01770e2b'
		]
	},
	'duplicate-code': {
		desc: 'Repeated code blocks. Consider extracting them into a shared method.',
		links: [
			'https://en.wikipedia.org/wiki/Duplicate_code',
			'https://medium.com/swlh/eliminate-duplicate-code-985b5c7e3e64'
		]
	}
};

function analyzeFunctionBody(body: string): string[] {
	const issues: string[] = [];
	const lineCount = body.split('\n').length;
	if (lineCount > 15) issues.push('extract-method');
	if ((body.match(/for|while|if/g) || []).length > 5) issues.push('extract-method');
	if (/int\s+\w+\s*=\s*[^;]+;/.test(body)) issues.push('replace-temp');
	if (/\{[^{}]*\}[^]*\{[^{}]*\}/.test(body)) issues.push('duplicate-code');
	return [...new Set(issues)];
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('complexity-analyzer.showComplexity', () => {
			const panel = vscode.window.createWebviewPanel(
				'cppRefactorPanel',
				'C++ Refactor Suggestions',
				vscode.ViewColumn.Beside,
				{
					enableScripts: true
				}
			);

			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				panel.webview.html = '<p>No active C++ editor found.</p>';
				return;
			}

			const fileName = editor.document.fileName;
			if (!(fileName.endsWith('.cpp') || fileName.endsWith('.c') || fileName.endsWith('.cc'))) {
				panel.webview.html = '<p>This extension works only with C/C++ files.</p>';
				return;
			}

			const text = editor.document.getText();
			const functionRegex = /([\w<>:]+[\s*&]+)?([\w:]+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
			let html = '<h2>Refactor Suggestions</h2>';
			let match;

			while ((match = functionRegex.exec(text)) !== null) {
				const funcName = match[2];
				const body = match[4];
				const detectedIssues = analyzeFunctionBody(body);
				if (detectedIssues.length === 0) continue;

				html += `<h3>${funcName}</h3>`;
				detectedIssues.forEach((issue) => {
					const info = refactorLinks[issue];
					html += `<p><b>${info.desc}</b><br>`;
					info.links.forEach((link) => {
						html += `<a href='${link}'>${link}</a><br>`;
					});
					html += '</p>';
				});
			}

			if (html === '<h2>Refactor Suggestions</h2>') {
				html += '<p>No issues found. Code looks clean!</p>';
			}

			panel.webview.html = `<html><body>${html}</body></html>`;
		})
	);
}

export function deactivate() { }
