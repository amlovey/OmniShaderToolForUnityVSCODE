import * as vscode from 'vscode';
import { fetchReferences, osLocationToLocation } from './SLSConnection';

export class OSFindRenferencesProvider implements vscode.ReferenceProvider {
    provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Location[]> {
        return fetchReferences(document, position).then(locations => {
            return locations.map(osLocationToLocation);
        });
    }
}
