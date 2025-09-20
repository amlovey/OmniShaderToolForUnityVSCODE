import * as vscode from 'vscode';
import { formatProgram, updateProgramToServer2 } from './SLSConnection';

export class OSFormatDocumentProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
        return formatProgram(document).then(data => {
            let range = document.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
            let edit = new vscode.TextEdit(range, data.code);
            return updateProgramToServer2(document.uri.fsPath, data.code).then(resp => {
                return [edit];
            });
        });
    }
}