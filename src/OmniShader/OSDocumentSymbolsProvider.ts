import * as vscode from 'vscode';
import { DocumentSymbolProvider, DocumentSymbol, Range } from 'vscode';
import { fetchDocumentSymbols, osKindToSymbolKind, osLocationToLocation, osLocationToRange, OSSymbol } from './SLSConnection';

export class OSDocumentSymbolsProvider implements DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | DocumentSymbol[]> {
        return fetchDocumentSymbols(document).then(symbols => symbols.map(this.toDocumentSymobl));
    }

    toDocumentSymobl(s: OSSymbol) {
        let name = s.name;
        let location = osLocationToLocation(s.location);
        let kind = osKindToSymbolKind(s.kind);

        return new vscode.SymbolInformation(name, kind, s.container, location);
    }
}