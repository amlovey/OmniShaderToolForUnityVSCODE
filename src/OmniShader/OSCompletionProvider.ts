import * as vscode from 'vscode';
import { fetchCompletion as fetchCompletions, osKindToCompletionKind } from './SLSConnection';

export class OSCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        return fetchCompletions(document, position, "").then(items => {
            return items.map(it => {
                return new vscode.CompletionItem(it.label, osKindToCompletionKind(it.kind));
            });
        });
    }
}