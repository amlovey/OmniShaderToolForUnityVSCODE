import * as vscode from 'vscode';
import { OSDocumentSymbolsProvider } from './OmniShader/OSDocumentSymbolsProvider';
import { OSGoToDefinitionProvider } from './OmniShader/OSGoToDefinitionProvider';
import { SHDAR_LANGUAGE_ID, UPDATE_TIME_DELAY } from './OmniShader/Constants';
import { OSHoverInformationProvider } from './OmniShader/OSHoverInfomationProvider';
import { updateProgram } from './OmniShader/SLSConnection';

export function activate(context: vscode.ExtensionContext) {
	let eidtTimeout: any;
	vscode.workspace.onDidChangeTextDocument(evt => {
		if (eidtTimeout) {
			clearTimeout(eidtTimeout);
		}

		eidtTimeout = setTimeout(() => {
			updateProgram(evt.document);
		}, UPDATE_TIME_DELAY);
	});

	let symbolProvider = new OSDocumentSymbolsProvider();
	let symbolProviderDispose = vscode.languages.registerDocumentSymbolProvider(SHDAR_LANGUAGE_ID, symbolProvider);

	let definitionProvider = new OSGoToDefinitionProvider();
	let definitionProviderDispose = vscode.languages.registerDefinitionProvider(SHDAR_LANGUAGE_ID, definitionProvider);

	let hoverProvider = new OSHoverInformationProvider();
	let hoverProviderDispose = vscode.languages.registerHoverProvider(SHDAR_LANGUAGE_ID, hoverProvider);

	context.subscriptions.push(symbolProviderDispose);
	context.subscriptions.push(definitionProviderDispose);
	context.subscriptions.push(hoverProviderDispose);
}

export function deactivate() {}
