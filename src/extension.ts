import * as vscode from 'vscode';
import { OSDocumentSymbolsProvider } from './OmniShader/OSDocumentSymbolsProvider';
import { OSGoToDefinitionProvider } from './OmniShader/OSGoToDefinitionProvider';
import { API_HOST, SHADER_FIELS_EXTENSION, SHDAR_LANGUAGE_ID } from './OmniShader/Constants';
import { OSHoverInformationProvider } from './OmniShader/OSHoverInfomationProvider';
import { OSCompletionProvider } from './OmniShader/OSCompletionProvider';
import { spawn } from 'child_process';
import path from 'path';
import fs, { existsSync, mkdirSync, rmSync, Stats } from 'fs';
import { API_Port, updateProgramToServer, updateProgramToServer2 } from './OmniShader/SLSConnection';
import { OSFindRenferencesProvider } from './OmniShader/OSFindReferencesProvider';
import { OSRenameProvider } from './OmniShader/OSRenameProvider';
import { OSSignatureHelpProvider } from './OmniShader/OSSignatureHelpProvider';
import { OSFormatDocumentProvider } from './OmniShader/OSFormatDocumentProvider';
import chokidar from 'chokidar';
import { logger, getLocalDataFolder, log } from './OmniShader/Util';

export function activate(context: vscode.ExtensionContext) {
	logger.channel = vscode.window.createOutputChannel("OmniShader Unity", "log");
	context.subscriptions.push(logger.channel);

	startLanguageServer(context);
	startFileWatcher(context);

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

	let renameProvider = new OSRenameProvider();
	let renameProviderDispose = vscode.languages.registerRenameProvider(SHDAR_LANGUAGE_ID, renameProvider);

	let signatureHelpProvider = new OSSignatureHelpProvider();
	let signatureHelpProviderDispose = vscode.languages.registerSignatureHelpProvider(SHDAR_LANGUAGE_ID, signatureHelpProvider, ",", "(", " ");

	let formatDocumentProvider = new OSFormatDocumentProvider();
	let formatDocumentProviderDispose = vscode.languages.registerDocumentFormattingEditProvider(SHDAR_LANGUAGE_ID, formatDocumentProvider);

	context.subscriptions.push(symbolProviderDispose);
	context.subscriptions.push(definitionProviderDispose);
	context.subscriptions.push(hoverProviderDispose);
	context.subscriptions.push(completionProviderDispose);
	context.subscriptions.push(referenceProvoideDispose);
	context.subscriptions.push(renameProviderDispose);
	context.subscriptions.push(signatureHelpProviderDispose);
	context.subscriptions.push(formatDocumentProviderDispose);

	vscode.workspace.onDidChangeTextDocument(handleRealtimeCommentInput);
}

export function deactivate() { }


function startLanguageServer(context: vscode.ExtensionContext) {
	API_Port.value = generatePortAndCleanUnused();
	let workspace = getWorkspaceFolder(context);

	let workingPath = path.join(context.extensionPath, "sls");
	let slsExe = path.join(workingPath, "sls");

	let slsProcess = spawn(slsExe, [API_Port.value, workspace], { cwd: workingPath });
	slsProcess.stdout?.on("data", data => {
		logSLS(data);
	});
	slsProcess.stderr?.on("error", error => {
		logSLS(error.message);
	});

	log(`Launching SLS at ${workspace}, port = ${API_Port.value}`);
}

function logSLS(msg: string) {
	log(`SLS: ${msg}`);
}

function getWorkspaceFolder(context: vscode.ExtensionContext) {
	let workspaceFolder = vscode.workspace.workspaceFolders;
	if (workspaceFolder && workspaceFolder.length > 0) {
		return workspaceFolder[0].uri.fsPath;
	}

	return ".";
}

function ignoredMatcher(path: string, stats?: fs.Stats): boolean{
	if (stats && !stats.isFile()) {
		return true;
	}

	for (let ext of SHADER_FIELS_EXTENSION) {
		if (path.endsWith(ext)) {
			return false;
		}
	}

	return true;
}

function startFileWatcher(context: vscode.ExtensionContext) {
	let workspace = getWorkspaceFolder(context);
	log(`Start file watcher at ${workspace}...`);
	let watcher = chokidar.watch(workspace, {
		persistent: true
	});

	watcher.on("add", (path, stats) => {
		if (ignoredMatcher(path, stats)) {
			return;
		}

		log("added " + path);
		let code = fs.readFileSync(path, { encoding: 'utf8', flag: 'r' });
		updateProgramToServer2(path, code);
	});

	watcher.on("unlink", (path, stats) => {
		if (ignoredMatcher(path, stats)) {
			return;
		}

		log("removed " + path);
		updateProgramToServer2(path, "", true);
	});

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

function handleRealtimeCommentInput(handleChange: any) {
	if (!handleChange || !handleChange.contentChanges || handleChange.contentChanges.length !== 1) {
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
				}).then(() => {
					let newPosition = new vscode.Position(newLineNumber, insertPosition.character + 4);
					if (editor) {
						editor.selection = new vscode.Selection(newPosition, newPosition);
					}
				});
			}
		}
	}
}