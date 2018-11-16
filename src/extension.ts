'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CoreMetrics } from './CoreMetrics';
import { CoreExporter } from './CoreExporter';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Create a new CoreMetrics Analyzer
    const coreMetrics = new CoreMetrics(context);

    // Register as a tree
    vscode.window.createTreeView('coreMetrics', {
        treeDataProvider: coreMetrics,
    });
    vscode.window.registerTreeDataProvider('coreMetrics', coreMetrics);

    // Register commands
    vscode.commands.registerCommand('coreMetrics.rebuild', () => coreMetrics.rebuild());
    vscode.commands.registerCommand('coreMetrics.refresh', () => coreMetrics.refresh());
    vscode.commands.registerCommand('coreMetrics.expandAll', () => coreMetrics.expandAll());
    vscode.commands.registerCommand('coreMetrics.export', () => CoreExporter.exportToCSV(coreMetrics.tree));
    vscode.commands.registerCommand('coreMetrics.openFile', (id: string) => {
        coreMetrics.openFile(id);
    });
}


// this method is called when your extension is deactivated
export function deactivate() {
}