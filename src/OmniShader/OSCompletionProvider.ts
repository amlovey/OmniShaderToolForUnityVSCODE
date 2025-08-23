import * as vscode from 'vscode';
import { fetchCompletion as fetchCompletions, osKindToCompletionKind, updateProgramToServer, } from './SLSConnection';

export class OSCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        let range = new vscode.Range(position.translate(0, -1), position);
        let trigger = document.getText(range);

        return updateProgramToServer(document).then(_ => {
            return fetchCompletions(document, position, trigger).then(items => {
                return items.map(it => {
                    return new vscode.CompletionItem(it.label, osKindToCompletionKind(it.kind));
                });
            });
        });
    }
}