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

	let activeEditor = vscode.window.activeTextEditor;

	function parseDotEnvText (text: string): {} {
		const NEWLINE = '\n'
		const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
		const RE_NEWLINES = /\\n/g
		const NEWLINES_MATCH = /\r\n|\n|\r/

		// TODO: demander au prof de ts
		const envVars: any = {};

		// convert Buffers before splitting into lines and processing
		const lines = text.toString().split(NEWLINES_MATCH);
		lines.forEach(function (line: string, idx: number) {
			// matching "KEY' and 'VAL' in 'KEY=VAL'
			const keyValueArr = line.match(RE_INI_KEY_VAL)
			// matched?
			if (keyValueArr != null) {
				const key = keyValueArr[1]
				// default undefined or missing values to empty string
				let val = (keyValueArr[2] || '')
				const end = val.length - 1
				const isDoubleQuoted = val[0] === '"' && val[end] === '"'
				const isSingleQuoted = val[0] === "'" && val[end] === "'"

				// if single or double quoted, remove quotes
				if (isSingleQuoted || isDoubleQuoted) {
					val = val.substring(1, end)

					// if double quoted, expand newlines
					if (isDoubleQuoted) {
						val = val.replace(RE_NEWLINES, NEWLINE)
					}
				} else {
					// remove surrounding whitespace
					val = val.trim()
				}

				envVars[key] = val;
			} else {
				console.log(`did not match key and value when parsing line ${idx + 1}: ${line}`)
			}
		})
		return envVars
	}

	async function getEnvVarsFromDotEnvFile() {
		// vscode.workspace.findFiles('**/.env', '**/.env.local', '**/.env.local.dist', '**/.env.dist').then(files => {
		const files = await vscode.workspace.findFiles('**/.env')
		if (files.length > 0) {
			const doc = await vscode.workspace.openTextDocument(files[0])
			const text = doc.getText()
			const envVars = parseDotEnvText(text);
			return envVars;
		}
		return {};
	}

	async function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const envVars = await getEnvVarsFromDotEnvFile();
		const regEx = /\$\{([A-Za-z0-9_.-]+)(?::([^\\}]*))?\}/g;
		const text = activeEditor.document.getText();
		let match;
		while ((match = regEx.exec(text))) {
			console.log('match:', match)

			// find the env var in the envVars array
			// TODO: demander au prof de ts
			console.log('envVars:', envVars)
			console.log('match[0]:', match[0])
			//@ts-ignore
			console.log('envVars[match[0]]:', envVars[match[1]])
			//@ts-ignore
			let matchedEnvVar: string = envVars[match[1]] || 'undefined';
			console.log('matchedEnvVar:', matchedEnvVar)

			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Environment variable **' + match[0] + '**' };

			const envVarDecoratorType = vscode.window.createTextEditorDecorationType({
				after: {
					contentText: "\t" + matchedEnvVar,
					color: "green",
				},
				// isWholeLine: true,
			});
			activeEditor.setDecorations(envVarDecoratorType, [decoration]);
		}
		
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
