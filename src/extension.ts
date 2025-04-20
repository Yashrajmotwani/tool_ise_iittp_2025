// extension.ts
import * as vscode from 'vscode';
import { getWebviewContent, getRefactorHTMLContent } from './webviewContent';
import { CodeEmotion } from './codeEmotion';

const isCppFile = (editor: vscode.TextEditor) => {
    const languageId = editor.document.languageId;
    return languageId === 'c' || languageId === 'cpp';
};

let codeEmotion: CodeEmotion;

export function activate(context: vscode.ExtensionContext) {
    codeEmotion = new CodeEmotion();

    let disposable = vscode.commands.registerCommand('code-review-helper.detectFunctions', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found!');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        const fileName = document.fileName.split(/[\\/]/).pop();

        const functionRegex = /(?:(?:int|void|float|double|char|string|bool)\s+)?(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;
        
        let functions: { name: string, body: string }[] = [];
        let match: RegExpExecArray | null;
        while ((match = functionRegex.exec(text)) !== null) {
            functions.push({ name: match[1], body: match[3] });
        }

        const panel = vscode.window.createWebviewPanel(
            'refactorSuggestions',
            `Code Review Checklist - ${fileName}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent(fileName || 'Untitled');

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'checkRefactor':
                        if (!isCppFile(editor)) {
                            vscode.window.showWarningMessage(
                                `Refactoring analysis is only available for C/C++ files, NOT (${fileName}).`,
                                "OK"
                            );
                            return;
                        }
                        const refactorContent = getRefactorHTMLContent(functions);
                        panel.webview.postMessage({
                            command: 'displayRefactor',
                            content: {
                                html: refactorContent.html,
                                issueCount: refactorContent.issueCount
                            }
                        });
                        break;
                        
                    case 'completeTask':
                        vscode.window.showInformationMessage(`Task completed: ${message.task}`);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        // Emoji decorations
        vscode.workspace.onDidChangeTextDocument(event => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document) {
                return;
            }

            codeEmotion.updateEmojiDecorations(editor, fileName || 'Untitled');
        });
    });

    context.subscriptions.push({
        dispose: () => codeEmotion.dispose()
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {}