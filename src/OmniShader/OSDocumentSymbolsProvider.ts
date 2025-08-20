import * as vscode from 'vscode';
import { DocumentSymbolProvider, DocumentSymbol, Range } from 'vscode';
import { fetchDocumentSymbols, osKindToSymbolKind, osLocationToLocation, OSSymbol, updateProgramToServer } from './SLSConnection';

export class OSDocumentSymbolsProvider implements DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[] | DocumentSymbol[]> {
        updateProgramToServer(document);
        
        return fetchDocumentSymbols(document).then(symbols => symbols.map(this.toDocumentSymobl));
    }

    toDocumentSymobl(s: OSSymbol) {
        let name = s.name;
        let location = osLocationToLocation(s.location);
        let kind = osKindToSymbolKind(s.kind);

        return new vscode.SymbolInformation(name, kind, s.container, location);
    }
}