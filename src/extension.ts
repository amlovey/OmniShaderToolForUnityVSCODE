import * as vscode from 'vscode';
import { OSDocumentSymbolsProvider } from './OmniShader/OSDocumentSymbolsProvider';
import { OSGoToDefinitionProvider } from './OmniShader/OSGoToDefinitionProvider';
import { API_HOST, SHDAR_LANGUAGE_ID } from './OmniShader/Constants';
import { OSHoverInformationProvider } from './OmniShader/OSHoverInfomationProvider';
import { OSCompletionProvider } from './OmniShader/OSCompletionProvider';
import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs, { existsSync, mkdirSync } from 'fs';
import { API_Port } from './OmniShader/SLSConnection';

var slsProcess: ChildProcess;

export function activate(context: vscode.ExtensionContext) {
	startLanguageServer(context);

	let symbolProvider = new OSDocumentSymbolsProvider();
	let symbolProviderDispose = vscode.languages.registerDocumentSymbolProvider(SHDAR_LANGUAGE_ID, symbolProvider);

	let definitionProvider = new OSGoToDefinitionProvider();
	let definitionProviderDispose = vscode.languages.registerDefinitionProvider(SHDAR_LANGUAGE_ID, definitionProvider);

	let hoverProvider = new OSHoverInformationProvider();
	let hoverProviderDispose = vscode.languages.registerHoverProvider(SHDAR_LANGUAGE_ID, hoverProvider);

	let completionProvider = new OSCompletionProvider();
	let triggerCharacters = ['.', ':', '"', '\\', '/'];
	let completionProviderDispose = vscode.languages.registerCompletionItemProvider(SHDAR_LANGUAGE_ID, completionProvider, ...triggerCharacters);

	context.subscriptions.push(symbolProviderDispose);
	context.subscriptions.push(definitionProviderDispose);
	context.subscriptions.push(hoverProviderDispose);
	context.subscriptions.push(completionProviderDispose);
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

	console.log(API_Port.value);
	slsProcess = spawn(slsExe, [API_Port.value, workspace], { stdio: 'inherit', cwd: workingPath });
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
	ports.forEach(async p => {
		let portFile = getPortFile(p);
		let url = `${API_HOST}:${API_Port}`;
		let response = await fetch(url);
		let result = await response.text();
		if (result === "Ok") {
			try {
				fs.rmSync(portFile);
			} catch {

			}
		}
	});

	return newPort.toString();
}

export function deactivate() { }
