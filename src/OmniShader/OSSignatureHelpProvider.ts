import * as vscode from 'vscode';
import { fetchSignature, OSSignatureHelp, OSSignatureInformation, updateProgramToServer } from './SLSConnection';

export class OSSignatureHelpProvider implements vscode.SignatureHelpProvider {
    provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext): vscode.ProviderResult<vscode.SignatureHelp> {
        let trigger = context.triggerCharacter;
        if (!trigger) {
            let range = new vscode.Range(position.translate(0, -1), position);
            trigger = document.getText(range);
        }

        return updateProgramToServer(document).then(_ => {
            return fetchSignature(document, position, trigger).then(help => {
                return this.osSignatureHelpToSignatureHelp(help);
            });
        });
    }

    osSignatureHelpToSignatureHelp(osSignHelp: OSSignatureHelp): vscode.SignatureHelp {
        let help = new vscode.SignatureHelp();
        help.activeParameter = osSignHelp.active_parameter;
        help.activeSignature = osSignHelp.active_signature;
        help.signatures = osSignHelp.signatures.map(this.osSignatureInfoToSignatureInfo);

        return help;
    }

    osSignatureInfoToSignatureInfo(osSignInfo: OSSignatureInformation): vscode.SignatureInformation {
        let info = new vscode.SignatureInformation(osSignInfo.label, osSignInfo.doc);
        info.activeParameter = osSignInfo.active_parameter;
        info.parameters = osSignInfo.parameters.map(it => {
            return new vscode.ParameterInformation(it.label, it.doc);
        });

        return info;
    }
}