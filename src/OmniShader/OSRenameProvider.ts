import * as vscode from 'vscode'
import { fetchReferences, fetchRename, OSLocation, osLocationToRange } from './SLSConnection';

export class OSRenameProvider implements vscode.RenameProvider {
    private locations: OSLocation[] = [];

    provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): vscode.ProviderResult<vscode.WorkspaceEdit> {
        if (!this.locations) {
            return null;
        }

        let edits = new vscode.WorkspaceEdit();
        this.locations.forEach(it => {
            let uri = vscode.Uri.file(it.path);
            let range = osLocationToRange(it);
            edits.replace(uri, range, newName);
        });

        return edits;
    }

    prepareRename?(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string; }> {
        this.locations = [];

        return fetchRename(document, position).then(items => {
            if (!items || items.length === 0) {
                return Promise.reject();
            }

            this.locations = items;
        });
    }
}