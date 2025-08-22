import * as vscode from 'vscode';
import { OSDocumentSymbolsProvider } from './OmniShader/OSDocumentSymbolsProvider';
import { OSGoToDefinitionProvider } from './OmniShader/OSGoToDefinitionProvider';
import { API_HOST, SHDAR_LANGUAGE_ID } from './OmniShader/Constants';
import { OSHoverInformationProvider } from './OmniShader/OSHoverInfomationProvider';
import { OSCompletionProvider } from './OmniShader/OSCompletionProvider';
import { spawn } from 'child_process';
import path from 'path';
import fs, { existsSync, mkdirSync, rmSync } from 'fs';
import { API_Port } from './OmniShader/SLSConnection';
import { OSFindRenferencesProvider } from './OmniShader/OSFindReferencesProvider';

export function activate(context: vscode.ExtensionContext) {
	// startLanguageServer(context);

	let symbolProvider = new OSDocumentSymbolsProvider();
	let symbolProviderDispose = vscode.languages.registerDocumentSymbolProvider(SHDAR_LANGUAGE_ID, symbolProvider);

	let definitionProvider = new OSGoToDefinitionProvider();
	let definitionProviderDispose = vscode.languages.registerDefinitionProvider(SHDAR_LANGUAGE_ID, definitionProvider);

	let hoverProvider = new OSHoverInformationProvider();
	let hoverProviderDispose = vscode.languages.registerHoverProvider(SHDAR_LANGUAGE_ID, hoverProvider);

	let completionProvider = new OSCompletionProvider();
	let triggerCharacters = ['.', ':', '"', '\\', '/'];
	let completionProviderDispose = vscode.languages.registerCompletionItemProvider(SHDAR_LANGUAGE_ID, completionProvider, ...triggerCharacters);

	let referenceProvider = new OSFindRenferencesProvider();
	let referenceProvoideDispose = vscode.languages.registerReferenceProvider(SHDAR_LANGUAGE_ID, referenceProvider);

	context.subscriptions.push(symbolProviderDispose);
	context.subscriptions.push(definitionProviderDispose);
	context.subscriptions.push(hoverProviderDispose);
	context.subscriptions.push(completionProviderDispose);
	context.subscriptions.push(referenceProvoideDispose);

	vscode.workspace.onDidChangeTextDocument(handleRealtimeCommentInput);
}

function startLanguageServer(context: vscode.ExtensionContext) {
	API_Port.value = generatePortAndCleanUnused();
	let workspace = context.extensionPath;
	let workspaceFolder = vscode.workspace.workspaceFolders;
	if (workspaceFolder && workspaceFolder.length > 0) {
		workspace = workspaceFolder[0].uri.fsPath;
	}

	let workingPath = path.join(context.extensionPath, "sls");
	let slsExe = path.join(workingPath, "sls");

	let slsProcess = spawn(slsExe, [API_Port.value, workspace], { stdio: 'inherit', cwd: workingPath });
	slsProcess.on("data", console.log);
	slsProcess.on("error", console.log);
}

function getLocalDataFolder(): string {
	return path.join(process.env.HOME || "~", "Library", "Application Support", "OmniShaderTools");
}

function getPortFile(port: string): string {
	let folder = getLocalDataFolder();
	return path.join(folder, `${port}.PORT`);
}

function generatePortAndCleanUnused(): string {
	let folder = getLocalDataFolder();
	if (!existsSync(folder)) {
		mkdirSync(folder);
	}

	let files = fs.readdirSync(folder);
	let ports = files.map(f => path.parse(f).name);

	let newPort = 17892 + Math.floor(Math.random() * 30000);
	while (ports.indexOf(newPort.toString()) !== -1) {
		newPort = 17892 + Math.floor(Math.random() * 30000);
	}

	// clean the port
	ports.forEach(p => {
		let portFile = getPortFile(p);
		let url = `${API_HOST}:${API_Port.value}`;
		fetch(url).catch(error => {
			try {
				rmSync(portFile);
			} catch {

			}
		});
	});

	return newPort.toString();
}

export function deactivate() { }

function handleRealtimeCommentInput(handleChange: any) {
    if (!handleChange || !handleChange.contentChanges || handleChange.contentChanges.length != 1) {
        return;
    }

    let changeText: string = handleChange.contentChanges[0].text;
    if (changeText.startsWith("\n") || changeText.startsWith("\r\n")) {
        let changeRange: vscode.Range = handleChange.contentChanges[0].range;
        let document: vscode.TextDocument = handleChange.document;
        let oldLine = document.lineAt(changeRange.start);
        var oldLineText = oldLine.text.trim();
        if (oldLineText.startsWith("///")) {
            let newLineNumber = oldLine.lineNumber + 1;
            var newline = document.lineAt(newLineNumber);
            var insertPosition = new vscode.Position(newline.lineNumber, newline.firstNonWhitespaceCharacterIndex);
            var editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(builder => {
                    builder.insert(insertPosition, "/// ");
                }).then(()=> {
                    let newPosition = new vscode.Position(newLineNumber, insertPosition.character + 4); 
					if (editor) {
						editor.selection = new vscode.Selection(newPosition, newPosition);
					}
                });
            }
        }
    }
}