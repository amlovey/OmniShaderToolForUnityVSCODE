import * as vscode from 'vscode';
import { API_HOST } from './Constants';

export interface OSHoverInfo {
    value: string,
    start?: OSPoint,
    end?: OSPoint,
    doc?: string,
}

export interface OSCompletion {
    label: string,
    kind: string,
    detail: string,
    documentation: string,
    insert_text: string,
}

export interface OSSymbol {
    name: string,
    container: string,
    kind: string,
    location: OSLocation,
}

export interface OSLocation {
    path: string,
    start: OSPoint,
    end: OSPoint,
}

export interface OSPoint {
    row: number,
    column: number,
}


export function osKindToSymbolKind(osKind: string): vscode.SymbolKind {
    switch (osKind) {
        case "Class": return vscode.SymbolKind.Class;
        case "Interface": return vscode.SymbolKind.Interface;
        case "Field": return vscode.SymbolKind.Field;
        case "Function": return vscode.SymbolKind.Function;
        case "Keyword": return vscode.SymbolKind.Key;
        case "Method": return vscode.SymbolKind.Method;
        case "Property": return vscode.SymbolKind.Property;
        case "Struct": return vscode.SymbolKind.Struct;
        case "Value": return vscode.SymbolKind.Constant;
        case "Variable": return vscode.SymbolKind.Variable;
    }

    return vscode.SymbolKind.Null;
}

export function osKindToCompletionKind(osKind: string): vscode.CompletionItemKind {
    switch (osKind) {
        case "Class": return vscode.CompletionItemKind.Class;
        case "Interface": return vscode.CompletionItemKind.Interface;
        case "Field": return vscode.CompletionItemKind.Field;
        case "Function": return vscode.CompletionItemKind.Function;
        case "Keyword": return vscode.CompletionItemKind.Keyword;
        case "Method": return vscode.CompletionItemKind.Method;
        case "Property": return vscode.CompletionItemKind.Property;
        case "Struct": return vscode.CompletionItemKind.Struct;
        case "Value": return vscode.CompletionItemKind.Constant;
        case "Variable": return vscode.CompletionItemKind.Variable;
    }

    return vscode.CompletionItemKind.Keyword;
}

export function osLocationToLocation(location: OSLocation) : vscode.Location {
    return new vscode.Location(vscode.Uri.file(location.path), osLocationToRange(location));
}

export function osPointToPosition(osp: OSPoint) {
    return new vscode.Position(osp.row, osp.column);
}

export function osLocationToRange(osLocation: OSLocation) {
    return new vscode.Range(osPointToPosition(osLocation.start), osPointToPosition(osLocation.end));
}


export async function fetchDocumentSymbols(document: vscode.TextDocument): Promise<OSSymbol[]> {
    let url = `${API_HOST}/symbol`;

    let body = new FormData();
    body.append("path", document.uri.fsPath);

    let response = await fetch(url, {
        method: "POST",
        body: body
    });

    return await response.json() as OSSymbol[];
}

export async function fetchDefition(document: vscode.TextDocument, pos: vscode.Position) : Promise<OSLocation> {
    let url = `${API_HOST}/definition`;
    
    let body = new FormData();
    body.append("path", document.uri.path);
    body.append("row", pos.line.toString());
    body.append("column", pos.character.toString());

    let response = await fetch(url, {
        method: "POST",
        body: body
    });

    let text = await response.text();
    if (text === "null") {
        return Promise.reject();
    }

    return Promise.resolve(JSON.parse(text) as OSLocation);
}

export async function fetchHover(document: vscode.TextDocument, pos: vscode.Position) : Promise<OSHoverInfo> {
    let url = `${API_HOST}/hover`;

    let body = new FormData();
    body.append("path", document.uri.path);
    body.append("row", pos.line.toString());
    body.append("column", pos.character.toString());

    let response = await fetch(url, {
        method: "POST",
        body: body
    });

    let text = await response.text();
    if (text === "null") {
        return Promise.reject();
    }

    return Promise.resolve(JSON.parse(text) as OSHoverInfo);
}

export async function fetchCompletion(document: vscode.TextDocument, pos: vscode.Position, triggerCharacter: string = "") : Promise<OSCompletion[]> {
    let url = `${API_HOST}/completion`;
    let body = new FormData();
    body.append("path", document.uri.fsPath);
    body.append("row", pos.line);
    body.append("column", pos.character);
    body.append("trigger", triggerCharacter);

    let response = await fetch(url, {
        method: "POST",
        body: body
    });

    return await response.json() as OSCompletion[];
}

export function updateProgramToServer(document: vscode.TextDocument) {
    let url = `${API_HOST}/update`;
    let body = new FormData();
    body.append("path", document.uri.fsPath);
    body.append("code", document.getText());

    fetch(url, {
        method: "POST",
        body: body
    });
}