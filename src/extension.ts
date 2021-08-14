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

	const envVarDecoratorType = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// this color will be used in light color themes
			color: 'darkblue'
		},
		dark: {
			// this color will be used in dark color themes
			color: 'lightblue'
		},
		// isWholeLine: true,
	});

	function parseDotEnvText (text: string): {} {
		const NEWLINE = '\n'
		const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
		const RE_NEWLINES = /\\n/g
		const NEWLINES_MATCH = /\r\n|\n|\r/

		// TODO: demander au prof de ts pour enlever le any
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
			}
			// else {
			// 	console.log(`did not match key and value when parsing line ${idx + 1}: ${line}`)
			// }
		})
		return envVars
	}

	/**
	 * @returns {object} Object containing the environment variables
	 */
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
		// match ${VAR} ${VAR:} ${VAR:DEFAULT} ${VAR:-} ${VAR:=} ${VAR:-DEFAULT} ${VAR:=DEFAULT}
		// https://regex101.com/r/GYgG8L/2
		const regEx = /\$\{([A-Za-z0-9_-]+)(?::([^\\}]*))?\}/g;
		const text = activeEditor.document.getText();
		let match;
		const decorations = [];
		
		while ((match = regEx.exec(text))) {
			// console.log('match:', match)

			// find the env var in the envVars array
			// TODO: demander au prof de ts
			//@ts-ignore
			let matchedValue: string = envVars[match[1]] || 'undefined';

			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = {
				range: new vscode.Range(startPos, endPos),
				hoverMessage: '**' + match[1] + '**=*' + matchedValue + '*',
				renderOptions: {
					after: {
						contentText: "\t" + matchedValue,
						color: matchedValue == 'undefined' ? "orange" : "green",
					},
				}
			};
			decorations.push(decoration);
		}
		activeEditor.setDecorations(envVarDecoratorType, decorations);
		
	}

	function triggerUpdateDecorations(activeEditor: vscode.TextEditor) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
			activeEditor.setDecorations(envVarDecoratorType, []);

		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		triggerUpdateDecorations(activeEditor);
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations(editor);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(activeEditor);
		}
	}, null, context.subscriptions);
	
}

// this method is called when your extension is deactivated
export function deactivate() {}
