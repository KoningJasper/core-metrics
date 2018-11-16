import * as vscode from 'vscode';
import * as path from 'path';
import { CoreAnalyzer } from './CoreAnalyzer';
import { Method } from './models/Method';

export class CoreMetrics implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<string | null> = new vscode.EventEmitter<string | null>();
    readonly onDidChangeTreeData: vscode.Event<string | null>        = this._onDidChangeTreeData.event;

    private expanded: boolean = false;
    public tree: Method[]     = [];

    constructor(private context: vscode.ExtensionContext) { }

    getWarningIcon() {
        return {
            light: this.context.asAbsolutePath(path.join('resources', 'light', 'alert.svg')),
            dark : this.context.asAbsolutePath(path.join('resources', 'dark', 'alert.svg'))
        };
    }

    getOkIcon() {
        return {
            light: this.context.asAbsolutePath(path.join('resources', 'light', 'check.svg')),
            dark : this.context.asAbsolutePath(path.join('resources', 'dark', 'check.svg'))
        };
    }

    getTreeItem(element: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (element === 'NO ELEMENTS') {
            return Promise.resolve(new vscode.TreeItem('Press rebuild.'));
        } else {
            if (element.includes('|')) {
                // Child item.
                let id   = element.split('|')[0];
                let type = element.split('|')[1];
                let item = this.tree.find(x => x.id === id);
                if (item === undefined) {
                    throw Error("Undefined object");
                }

                let treeItem = new vscode.TreeItem(item.name, vscode.TreeItemCollapsibleState.None);
                switch (type) {
                    case "MaintainabilityIndex": 
                        treeItem.label    = 'MaintainabilityIndex: ' + item.metrics.maintainabilityIndex;
                        treeItem.iconPath = item.metrics.warnings.indexOf('MaintainabilityIndex') > -1 ? this.getWarningIcon() : this.getOkIcon();
                        break;
                    case "CyclomaticComplexity": 
                        treeItem.label    = 'CyclomaticComplexity: ' + item.metrics.cyclomaticComplexity;
                        treeItem.iconPath = item.metrics.warnings.indexOf('CyclomaticComplexity') > -1 ? this.getWarningIcon() : this.getOkIcon();
                        break;
                    case "LinesOfCode": 
                        treeItem.label    = 'LinesOfCode: ' + item.metrics.linesOfCode;
                        treeItem.iconPath = item.metrics.warnings.indexOf('LinesOfCode') > -1 ? this.getWarningIcon() : this.getOkIcon();
                        break;
                    case "ClassCoupling": 
                        treeItem.label    = 'ClassCoupling: ' + item.metrics.classCoupling;
                        treeItem.iconPath = item.metrics.warnings.indexOf('ClassCoupling') > -1 ? this.getWarningIcon() : this.getOkIcon();
                        break;
                }

                treeItem.id = element;
                return Promise.resolve(treeItem);
            } else {
                let item = this.tree.find(x => x.id === element);

                if (item === undefined) {
                    throw Error("Undefined object");
                }

                let treeItem      = new vscode.TreeItem(item.name, this.expanded === true ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed);
                treeItem.id       = item.id.toString();
                treeItem.tooltip  = `${item.metrics.warnings.length} warnings with Error score of ${item.metrics.score}`;
                treeItem.iconPath = {
                    light: this.context.asAbsolutePath(path.join('resources', 'light', 'function.svg')),
                    dark : this.context.asAbsolutePath(path.join('resources', 'dark', 'function.svg'))
                };
                treeItem.command = {
                    title    : 'Open File',
                    command  : 'coreMetrics.openFile',
                    tooltip  : 'Open the file',
                    arguments: [treeItem.id]
                };
                return Promise.resolve(treeItem);
            }
        }
    }

    async openFile(id: string): Promise<void> {
        let item = this.tree.find((x: Method) => x.id === id);
        if (item === undefined){
            throw Error('Exception');
        }
        let uri : vscode.Uri             = vscode.Uri.file(item.file);
        let document : vscode.TextEditor = await vscode.window.showTextDocument(uri);
        document.revealRange(new vscode.Range(new vscode.Position(item.line, 0), new vscode.Position(item.line + 1, 0)), vscode.TextEditorRevealType.InCenter);
    }

    async expandAll(): Promise<void> {
        this.expanded = true;
        this._onDidChangeTreeData.fire();
    }

    async refresh(): Promise<void> {
        // Load the report.
        this.tree = await CoreAnalyzer.analyze(`${this.context.storagePath}\\report.xml`);
        this._statusBarItem.hide();
        this._onDidChangeTreeData.fire();
    }

    async rebuild(): Promise<void> {
        // Trigger the report
        this._createReport();
    }

    hasError(e: Method): boolean {
        return e.metrics.score > 0;
    }

    getChildren(element?: string | undefined): vscode.ProviderResult<string[]> {
        if (element === undefined) {
            // Root
            if (this.tree.length === 0) {
                return ['NO ELEMENTS'];
            } else {
                return this.tree.filter((x: Method) => this.hasError(x) === true).sort((a: Method, b: Method) => b.metrics.score - a.metrics.score).map((x: Method) => x.id);
            }
        } else {
            if (element.includes('|')) {
                return [];
            } else {
                let item = this.tree.find(x => x.id === element);

                if (item === undefined) {
                    throw Error("Undefined object");
                }

                var metricIds: string[] = [];
                let id                  = item.id;

                // Add all the warnings
                item.metrics.warnings.forEach((warning: string) =>{
                    metricIds.push(`${id}|${warning}`);
                });
                return metricIds;
            }
        }
    }

    getParent?(element: string): vscode.ProviderResult<string> {
        return null;
    }

    private _statusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    public async updateStatus() {
        // let editor = vscode.window.activeTextEditor;

        // Only update on .cs files
        // if (doc.languageId === "csharp") {
        this._createReport();
        // }
    }

    // Called if the report has been completed.
    public complete(): void {
        this._statusBarItem.text = '$(zap) Analyzing results...';

        this.refresh();
    }

    public findSln(): string {
        let folders = vscode.workspace.workspaceFolders;
        if (folders === undefined || folders.length === 0) {
            throw Error('No root folder!');
        }
        let root  = folders[0].uri;
        const fs  = require('fs');
        let files = fs.readdirSync(root.fsPath);
        return root.fsPath + '\\' + files.filter((_: string) => _.match(/.*\.sln/))[0];
    }

    // Generates a new report based on the solution.
    public _createReport(): void {
        // TODO: Get the path.
        let sln     = this.findSln();
        let metrics = `${this.context.extensionPath}\\roslyn-metrics\\Metrics.exe`;

        // Create dir if not exists.
        let fs = require('fs');
        if (!fs.existsSync(this.context.storagePath)) {
            fs.mkdirSync(this.context.storagePath, {
                recursive: true,
            });
        }

        const cp = require('child_process');
        let e    = cp.exec(`${metrics} /s:"${sln}" /o:"${this.context.storagePath}\\report.xml"`);

        this._statusBarItem.text = '$(zap) Building...';
        this._statusBarItem.show();

        e.stdout.on('data', (data: string) => {
            if (data.includes('Completed Successfully.')) {
                // Report complete
                this.complete();
            }
        });
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}