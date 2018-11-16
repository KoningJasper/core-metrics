import { Method } from "./models/Method";
import * as vscode from 'vscode';

export class CoreExporter {
    public static async exportToCSV(methods: Method[]): Promise<void> {
        if (methods && methods.length > 0) {
            let location: string | undefined = await vscode.window.showInputBox({
                prompt     : "Location to export to",
                placeHolder: "C:\\report.csv"
            });

            if (location === undefined || location === "") {
                vscode.window.showErrorMessage('Location is required!');
            } else {
                const json2csv = require('json2csv').parse;
                const fields   = ['id', 'name', 'file', 'metrics.MaintainabilityIndex', 'metrics.CyclomaticComplexity', 'metrics.ClassCoupling', 'metrics.DepthOfInheritance', 'metrics.LinesOfCode'];
                const opts     = { fields };

                try {
                    // Export to csv string
                    const csv = json2csv(methods, opts);

                    // Write the file
                    const fs = require('fs');
                    fs.writeFileSync(location, csv);
                    vscode.window.showInformationMessage(`Export written to ${location}.`);
                    vscode.window.showTextDocument(vscode.Uri.parse(location));
                } catch (err) {
                    vscode.window.showErrorMessage(err);
                }
            }
        } else {
            vscode.window.showErrorMessage('No data to export!');
        }
    }
}