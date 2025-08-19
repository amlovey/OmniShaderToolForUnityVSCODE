import * as vscode from 'vscode';
import { fetchHover } from './SLSConnection';
import { SHDAR_LANGUAGE_ID } from './Constants';

export class OSHoverInformationProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        return fetchHover(document, position).then(info => {
            return new vscode.Hover([
                new vscode.MarkdownString(info.doc),
                { language: SHDAR_LANGUAGE_ID, value: info.value }
            ]);
        });
    }
}