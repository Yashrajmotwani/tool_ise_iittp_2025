// import * as vscode from 'vscode';
// import { spawn } from 'child_process';

// let heatmapVisible = false;

// let green: vscode.TextEditorDecorationType;
// let yellow: vscode.TextEditorDecorationType;
// let red: vscode.TextEditorDecorationType;

// interface FileDecorations {
//     green: vscode.DecorationOptions[];
//     yellow: vscode.DecorationOptions[];
//     red: vscode.DecorationOptions[];
// }

// const storedDecorationsPerFile = new Map<string, FileDecorations>();

// function createDecorationTypes() {
//     green = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(56, 230, 56, 0.4)' });
//     yellow = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(231, 231, 30, 0.4)' });
//     red = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(212, 31, 31, 0.4)' });
// }

// function applyDecorations(editor: vscode.TextEditor) {
//     const decorations = storedDecorationsPerFile.get(editor.document.fileName);
//     if (!decorations) return;

//     editor.setDecorations(green, decorations.green);
//     editor.setDecorations(yellow, decorations.yellow);
//     editor.setDecorations(red, decorations.red);
// }

// function clearDecorations(editor: vscode.TextEditor) {
//     editor.setDecorations(green, []);
//     editor.setDecorations(yellow, []);
//     editor.setDecorations(red, []);
//     storedDecorationsPerFile.delete(editor.document.fileName);
// }

// function toggleHeatmapFucntion() {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) return;

//     if (heatmapVisible) {
//         clearDecorations(editor);
//         vscode.window.showInformationMessage(`Heatmap is now OFF`);
//     } else {
//         runLizardAndDecorate();
//         vscode.window.showInformationMessage(`Heatmap is now ON`);
//     }

//     heatmapVisible = !heatmapVisible;
// }

// function runLizardAndDecorate() {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) {
//         vscode.window.showErrorMessage('No active editor');
//         return;
//     }

//     const filePath = editor.document.fileName;
//     const ext = filePath.split('.').pop()?.toLowerCase();
//     if (!['cpp', 'c', 'java', 'py'].includes(ext ?? '')) {
//         vscode.window.showErrorMessage('Unsupported file type.');
//         return;
//     }

//     let lang = 'cpp';
//     if (ext === 'java') lang = 'java';
//     else if (ext === 'py') lang = 'python';

//     const lizardPath = 'C:\\Users\\dell\\AppData\\Roaming\\Python\\Python313\\Scripts\\lizard.exe';
//     const lizardProcess = spawn(lizardPath, ['-l', lang, '-C', '0', filePath]);

//     let output = '';
//     let error = '';

//     lizardProcess.stdout.on('data', (data) => {
//         output += data.toString();
//     });

//     lizardProcess.stderr.on('data', (data) => {
//         error += data.toString();
//     });

//     lizardProcess.on('close', () => {
//         if (error) {
//             vscode.window.showErrorMessage(`Lizard error: ${error}`);
//             return;
//         }

//         const lines = output.split('\n').filter(line => line.includes('@'));
//         const results = lines.map(line => {
//             const match = line.match(/^\s*\d+\s+(\d+)\s+.*?@(\d+)-\d+@/);
//             if (match) {
//                 return {
//                     score: parseInt(match[1], 10),
//                     line: parseInt(match[2], 10)
//                 };
//             }
//             return null;
//         }).filter((x): x is { line: number, score: number } => x !== null);

//         const decorations: FileDecorations = {
//             green: [],
//             yellow: [],
//             red: []
//         };

//         for (const fn of results) {
//             const range = new vscode.Range(fn.line - 1, 0, fn.line - 1, 100);
//             const decor = { range, hoverMessage: `Complexity: ${fn.score}` };
//             if (fn.score <= 5) decorations.green.push(decor);
//             else if (fn.score <= 10) decorations.yellow.push(decor);
//             else decorations.red.push(decor);
//         }

//         storedDecorationsPerFile.set(filePath, decorations);
//         applyDecorations(editor);
//         heatmapVisible = true;
//         vscode.window.showInformationMessage(`Heatmap is now ON`);
//     });
// }

// export function activate(context: vscode.ExtensionContext) {
//     createDecorationTypes();

//     const analyzeCmd = vscode.commands.registerCommand('heatmap.analyzeComplexity', () => {
//         runLizardAndDecorate();
//     });

//     const toggleCmd = vscode.commands.registerCommand('heatmap.toggleHeatmap', () => {
//         toggleHeatmapFucntion();
//     });

//     const openWebViewCmd = vscode.commands.registerCommand('heatmap.openWebView', () => {
//         const panel = vscode.window.createWebviewPanel(
//             'heatmapWebView',
//             'Heatmap Control Panel',
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         panel.webview.html = getWebViewContent();

//         panel.webview.onDidReceiveMessage(
//             message => {
//                 if (message.command === 'toggleHeatmap') {
//                     vscode.commands.executeCommand('heatmap.toggleHeatmap');
//                 }
//             },
//             undefined,
//             context.subscriptions
//         );
//     });

//     vscode.window.onDidChangeActiveTextEditor(editor => {
//         if (editor && heatmapVisible) {
//             applyDecorations(editor);
//         }
//     });

//     context.subscriptions.push(analyzeCmd, toggleCmd, openWebViewCmd);
// }

// function getWebViewContent(): string {
//     return `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <title>Heatmap Panel</title>
//         </head>
//         <body>
//             <h2>Heatmap Controls</h2>
//             <button onclick="toggleHeatmap()">Toggle Heatmap</button>

//             <script>
//                 const vscode = acquireVsCodeApi();
//                 function toggleHeatmap() {
//                     vscode.postMessage({ command: 'toggleHeatmap' });
//                 }
//             </script>
//         </body>
//         </html>
//     `;
// }

// export function deactivate() {}




// // import * as vscode from 'vscode';
// // import { spawn } from 'child_process';

// // let heatmapVisible = false;

// // let green: vscode.TextEditorDecorationType;
// // let yellow: vscode.TextEditorDecorationType;
// // let red: vscode.TextEditorDecorationType;

// // let storedDecorations = {
// //     green: [] as vscode.DecorationOptions[],
// //     yellow: [] as vscode.DecorationOptions[],
// //     red: [] as vscode.DecorationOptions[]
// // };

// // function createDecorationTypes() {
// //     green = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(56, 230, 56, 0.4)' });
// //     yellow = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(231, 231, 30, 0.4)' });
// //     red = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(212, 31, 31, 0.4)' });
// // }

// // function applyDecorations(editor: vscode.TextEditor) {
// //     editor.setDecorations(green, storedDecorations.green);
// //     editor.setDecorations(yellow, storedDecorations.yellow);
// //     editor.setDecorations(red, storedDecorations.red);
// // }

// // function clearDecorations(editor: vscode.TextEditor) {
// //     editor.setDecorations(green, []);
// //     editor.setDecorations(yellow, []);
// //     editor.setDecorations(red, []);
// // }

// // function toggleHeatmapFucntion() {
// //     const editor = vscode.window.activeTextEditor;
// //     if (!editor) return;

// //     if (heatmapVisible) {
// //         clearDecorations(editor);
// //         vscode.window.showInformationMessage(`Heatmap is now OFF`);
// //     } else {
// //         runLizardAndDecorate();
// //     }

// //     heatmapVisible = !heatmapVisible;
// // }

// // function runLizardAndDecorate() {
// //     const editor = vscode.window.activeTextEditor;
// //     if (!editor) {
// //         vscode.window.showErrorMessage('No active editor');
// //         return;
// //     }

// //     const filePath = editor.document.fileName;
// //     const ext = filePath.split('.').pop()?.toLowerCase();
// //     if (!['cpp', 'c', 'java', 'py'].includes(ext ?? '')) {
// //         vscode.window.showErrorMessage('Unsupported file type.');
// //         return;
// //     }

// //     let lang = 'cpp';
// //     if (ext === 'java') lang = 'java';
// //     else if (ext === 'py') lang = 'python';

// //     const lizardPath = 'C:\\Users\\dell\\AppData\\Roaming\\Python\\Python313\\Scripts\\lizard.exe';
// //     const lizardProcess = spawn(lizardPath, ['-l', lang, '-C', '0', filePath]);

// //     let output = '';
// //     let error = '';

// //     lizardProcess.stdout.on('data', (data) => {
// //         output += data.toString();
// //     });

// //     lizardProcess.stderr.on('data', (data) => {
// //         error += data.toString();
// //     });

// //     lizardProcess.on('close', () => {
// //         if (error) {
// //             vscode.window.showErrorMessage(`Lizard error: ${error}`);
// //             return;
// //         }

// //         const lines = output.split('\n').filter(line => line.includes('@'));
// //         const results = lines.map(line => {
// //             const match = line.match(/^\s*\d+\s+(\d+)\s+.*?@(\d+)-\d+@/);
// //             if (match) {
// //                 return {
// //                     score: parseInt(match[1], 10),
// //                     line: parseInt(match[2], 10)
// //                 };
// //             }
// //             return null;
// //         }).filter((x): x is { line: number, score: number } => x !== null);

// //         storedDecorations.green = [];
// //         storedDecorations.yellow = [];
// //         storedDecorations.red = [];

// //         for (const fn of results) {
// //             const range = new vscode.Range(fn.line - 1, 0, fn.line - 1, 100);
// //             const decor = { range, hoverMessage: `Complexity: ${fn.score}` };
// //             if (fn.score <= 5) storedDecorations.green.push(decor);
// //             else if (fn.score <= 10) storedDecorations.yellow.push(decor);
// //             else storedDecorations.red.push(decor);
// //         }

// //         applyDecorations(editor);
// //         heatmapVisible = true;
// //         vscode.window.showInformationMessage(`Heatmap is now ON`);
// //     });
// // }

// // export function activate(context: vscode.ExtensionContext) {
// //     createDecorationTypes();

// //     const analyzeCmd = vscode.commands.registerCommand('heatmap.analyzeComplexity', () => {
// //         runLizardAndDecorate();
// //     });

// //     const toggleCmd = vscode.commands.registerCommand('heatmap.toggleHeatmap', () => {
// //         toggleHeatmapFucntion();
// //     });

// //     const openWebViewCmd = vscode.commands.registerCommand('heatmap.openWebView', () => {
// //         const panel = vscode.window.createWebviewPanel(
// //             'heatmapWebView',
// //             'Heatmap Control Panel',
// //             vscode.ViewColumn.One,
// //             { enableScripts: true }
// //         );

// //         panel.webview.html = getWebViewContent();

// //         panel.webview.onDidReceiveMessage(
// //             message => {
// //                 if (message.command === 'toggleHeatmap') {
// //                     vscode.commands.executeCommand('heatmap.toggleHeatmap');
// //                 }
// //             },
// //             undefined,
// //             context.subscriptions
// //         );
// //     });

// //     context.subscriptions.push(analyzeCmd, toggleCmd, openWebViewCmd);
// // }

// // function getWebViewContent(): string {
// //     return `
// //         <!DOCTYPE html>
// //         <html lang="en">
// //         <head>
// //             <meta charset="UTF-8">
// //             <title>Heatmap Panel</title>
// //         </head>
// //         <body>
// //             <h2>Heatmap Controls</h2>
// //             <button onclick="toggleHeatmap()">Toggle Heatmap</button>

// //             <script>
// //                 const vscode = acquireVsCodeApi();

// //                 function toggleHeatmap() {
// //                     vscode.postMessage({ command: 'toggleHeatmap' });
// //                 }
// //             </script>
// //         </body>
// //         </html>
// //     `;
// // }

// // export function deactivate() {}

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('cpp-refactor-helper.detectFunctions', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found!');
			return;
		}

		const document = editor.document;
		const text = document.getText();
		const functionRegex = /(\w+\s+)?(?!main\b)(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g;

		let functions: { name: string; body: string }[] = [];
		let match;

		while ((match = functionRegex.exec(text)) !== null) {
			functions.push({ name: match[2], body: match[4] });
		}

		let functionIssues: { [key: string]: { issues: string[], links: string[] } } = {};
		const issueDefinitions: { [key: string]: string } = {
			"Too many if-else statements! Consider using polymorphism.": "https://refactoring.guru/replace-conditional-with-polymorphism",
			"Large switch detected! Consider using the state pattern.": "https://refactoring.guru/state",
			"Nested loops detected! Try early return or breaking into smaller functions.": "https://refactoring.guru/split-loop",
			"Too many parameters! Consider encapsulating them into an object.": "https://refactoring.guru/introduce-parameter-object",
			"Magic numbers detected! Use named constants.": "https://refactoring.guru/replace-magic-number-with-symbolic-constant",
			"Complex expressions detected! Introduce explaining variables.": "https://refactoring.guru/extract-variable",
			"Possible unused variable detected! Consider removing dead code.": "https://refactoring.guru/remove-dead-code"
		};

		functions.forEach(func => {
			const functionName = func.name;
			const body = func.body;
			const detectedIssues = new Set<string>();

			if ((body.match(/\bif\s*\(.*\)\s*\{/g) || []).length > 3) {
				detectedIssues.add("Too many if-else statements! Consider using polymorphism.");
			}

			if (body.includes("switch")) {
				detectedIssues.add("Large switch detected! Consider using the state pattern.");
			}

			if ((body.match(/\b(for|while)\b/g) || []).length > 1) {
				detectedIssues.add("Nested loops detected! Try early return or breaking into smaller functions.");
			}

			if ((body.match(/,/g) || []).length > 4) {
				detectedIssues.add("Too many parameters! Consider encapsulating them into an object.");
			}

			const magicNumberPattern = /\b(?!case\s+)(?!return\s+)(?!default\s+)(\d+)\b/;
			if (magicNumberPattern.test(body)) {
				detectedIssues.add("Magic numbers detected! Use named constants.");
			}

			if (/(\w+\s*=\s*\w+\s*[+\-*/]\s*\w+)/.test(body)) {
				detectedIssues.add("Complex expressions detected! Introduce explaining variables.");
			}

			const unusedVariablePattern = /\b(?:int|double|float|char|bool|string|long)\s+\w+\s*;/;
			if (unusedVariablePattern.test(body)) {
				detectedIssues.add("Possible unused variable detected! Consider removing dead code.");
			}

			functionIssues[functionName] = { issues: Array.from(detectedIssues), links: [] };
			functionIssues[functionName].issues.forEach(issue => {
				functionIssues[functionName].links.push(issueDefinitions[issue]);
			});
		});

		let htmlContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                    .function-item { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                    .refactor-link { color: #0066cc; text-decoration: none; }
                </style>
            </head>
            <body>
                <h1>C++ Code Refactor</h1>
                <h2>Refactoring Suggestions</h2>
                <ul>
        `;

		for (const [funcName, data] of Object.entries(functionIssues)) {
			htmlContent += `<li class="function-item">
                <strong>Function Name:</strong> ${funcName} <br>`;

			if (data.issues.length === 0) {
				htmlContent += `<em>No issues detected.</em><br>`;
			} else {
				data.issues.forEach((issue, index) => {
					htmlContent += `<strong>Problem detected:</strong> ${issue} <br>
                    <strong>Possible Solution:</strong> <a class="refactor-link" href="${data.links[index]}" target="_blank">Click here to learn more</a><br><br>`;
				});
			}

			htmlContent += `</li>`;
		}

		htmlContent += `</ul></body></html>`;

		const panel = vscode.window.createWebviewPanel(
			'refactorSuggestions',
			'Code Refactor Suggestions',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);
		panel.webview.html = htmlContent;
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
