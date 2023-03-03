// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {exec} from "child_process";
import path = require('path');
import * as fs from 'fs';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('review-gpt.review', () => {
		if(vscode.window.activeTextEditor !== undefined && vscode.workspace.workspaceFolders !== undefined) {
			const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
			const dirPath = vscode.workspace.workspaceFolders[0].uri.fsPath ; 
			const configuration = vscode.workspace.getConfiguration('rgpt');
			const command =  `rgpt --input "$(git diff ${filePath})" --model "${configuration.model}" --max ${configuration.max_tokens} --temp ${configuration.temperature} --topp ${configuration.top_p} --freq ${configuration.frequence_penalty} --pres ${configuration.presence_penalty} --best ${configuration.best_of} --pretty=false`;
			vscode.window.showInformationMessage("Reviewing code...");
			exec(command, {cwd: dirPath}, async (err, stdout, stderr) => {
				if (err || stderr) {
					if (err?.message.includes("Input flag is empty") || stderr.includes("Input flag is empty")) {
						vscode.window.showErrorMessage(`The current file doesn't have a git diff. File: ${filePath}`);
						return;
					} else if (err?.message.includes("command not found")) {
						vscode.window.showErrorMessage("Please install the review-gpt CLI before running");
						return;
					} else {
						let errorMessage;
						if (err?.message !== undefined && err.message !== null) {
							errorMessage = JSON.parse(err.message);
						} else {
							errorMessage = JSON.parse(stderr);
						}
						console.log(errorMessage);
						vscode.window.showErrorMessage(`Message: ${errorMessage.message}, Error: ${errorMessage.error});
						}`);
						return;
					}
				}
				const temporaryFile = `rgpt-output`;
				const tempFilePath = path.join("/tmp/", temporaryFile);
				fs.writeFileSync(tempFilePath, stdout, 'utf8');
				const openPath = vscode.Uri.file(tempFilePath);
				const doc = await vscode.workspace.openTextDocument(openPath);
				await vscode.window.showTextDocument(doc);
				fs.unlinkSync(tempFilePath);
			});
		} else {
			const message = "Working file and/or directory not found, open a file and directory and try again" ;
			vscode.window.showErrorMessage(message);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
