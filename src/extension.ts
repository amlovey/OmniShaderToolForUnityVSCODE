import * as vscode from 'vscode';
import { OSDocumentSymbolsProvider } from './OmniShader/OSDocumentSymbolsProvider';
import { OSGoToDefinitionProvider } from './OmniShader/OSGoToDefinitionProvider';
import { SHDAR_LANGUAGE_ID } from './OmniShader/Constants';
import { OSHoverInformationProvider } from './OmniShader/OSHoverInfomationProvider';
import { OSCompletionProvider } from './OmniShader/OSCompletionProvider';
import { ChildProcess, spawn } from 'child_process';
import { launchSLS } from './OmniShader/SLSConnection';
import path from 'path';

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
	
	if (slsProcess) {
		return;
	}

	let workspace = "";
	let port = "17982";
	let workspaceFolder = vscode.workspace.workspaceFolders;
	if (workspaceFolder && workspaceFolder.length > 0) {
		workspace = workspaceFolder[0].uri.fsPath;
	}

	let workingPath = path.join(context.extensionPath, "sls");
	let slsExe = path.join(workingPath, "sls");

	slsProcess = spawn(slsExe, [port, workspace], { stdio: 'inherit', cwd: workingPath});
	slsProcess.on("data", console.log);
	slsProcess.on("error", console.log);
}

export function deactivate() { }
