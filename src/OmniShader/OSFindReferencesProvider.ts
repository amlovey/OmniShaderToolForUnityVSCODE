import * as vscode from 'vscode';

export class OSFindRenferencesProvider implements vscode.ReferenceProvider {
    provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Location[]> {
        throw new Error('Method not implemented.');
    }
}
