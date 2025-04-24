// src/extension.ts
import * as vscode from 'vscode';
import { analyzeComplexityAST } from './astComplexity';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	context.subscriptions.push(statusBarItem);

	const updateStatusBar = (document: vscode.TextDocument) => {
		if (document.languageId !== 'cpp') {
			statusBarItem.hide();
			return;
		}
		const complexity = analyzeComplexityAST(document.getText());
		statusBarItem.text = `$(dashboard) Time Complexity: ${complexity}`;
		statusBarItem.show();
	};

	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) updateStatusBar(editor.document);
	}));

	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(updateStatusBar));
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => updateStatusBar(e.document)));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(updateStatusBar));

	if (vscode.window.activeTextEditor) {
		updateStatusBar(vscode.window.activeTextEditor.document);
	}

	const hoverProvider = vscode.languages.registerHoverProvider('cpp', {
		provideHover(document, position, token) {
			const complexity = analyzeComplexityAST(document.getText());
			return new vscode.Hover(`**Estimated Time Complexity:** ${complexity}`);
		}
	});
	context.subscriptions.push(hoverProvider);
}
