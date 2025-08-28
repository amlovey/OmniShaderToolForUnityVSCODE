import path from "path";
import * as vscode from 'vscode';

export function getLocalDataFolder(): string {
    return path.join(process.env.HOME || "~", "Library", "Application Support", "OmniShaderTools");
}

export interface ILogger {
    channel?: vscode.OutputChannel
}

export const logger: ILogger = {
    channel: undefined
};

export function log(msg: string) {
    logger.channel?.appendLine(`${formatDateTime(new Date())}: ${msg}`);
}

function padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
}

function formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = padTo2Digits(date.getMonth() + 1); // Month is 0-indexed
    const day = padTo2Digits(date.getDate());
    const hours = padTo2Digits(date.getHours());
    const minutes = padTo2Digits(date.getMinutes());
    const seconds = padTo2Digits(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}