import * as vscode from 'vscode';
import { fetchDefition, osLocationToLocation } from './SLSConnection';

export class OSGoToDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        return fetchDefition(document, position).then(osLocation => {
            if (osLocation.path.endsWith(".std")) {
                return null;
            }

            return osLocationToLocation(osLocation);
        });
    }
}