// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activatedconsole.log('Congratulations, your extension "env-watcher" is now active!');
	console.log('Congratulations, your extension "env-watcher" is now active!');

	let timeout: NodeJS.Timer | undefined = undefined;

	const envVarDecoratorType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: "a bien coucou",
			color: "green",
		},
		isWholeLine: true,
	});

	let activeEditor = vscode.window.activeTextEditor;

	function readDotEnvFile() {
		
	}

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		readDotEnvFile();
		const regEx = /\$\{([A-Za-z0-9_.-]+)(?::([^\\}]*))?\}/g;
		const text = activeEditor.document.getText();
		const envVars: vscode.DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
			console.log('match:', match)
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Environment variable **' + match[0] + '**' };
			envVars.push(decoration);
		}
		activeEditor.setDecorations(envVarDecoratorType, envVars);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);
	
}

// this method is called when your extension is deactivated
export function deactivate() {}
