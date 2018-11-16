import { Method } from "./models/Method";
import { Metrics } from "./models/Metrics";
import * as vscode from 'vscode';

// The main analyzer
// Extracts information from the XML report.
export class CoreAnalyzer {
    private static maxCyclomaticComplexity = Number(vscode.workspace.getConfiguration('coreMetrics').get('cyclomaticComplexity'));
    private static maxLinesOfCode          = Number(vscode.workspace.getConfiguration('coreMetrics').get('linesOfCode'));
    private static minMaintainabilityIndex = Number(vscode.workspace.getConfiguration('coreMetrics').get('maintainabilityIndex'));
    private static maxClassCoupling        = Number(vscode.workspace.getConfiguration('coreMetrics').get('classCoupling'));

    // Builds the tree view.
    public static async analyze(path: string): Promise<Method[]> {


        var fs     = require('fs');
        var xml2js = require('xml2js');
        var xpath  = require("xml2js-xpath");

        var methods: Array<Method> = [];
        var parser                 = new xml2js.Parser();

        let xml = fs.readFileSync(path, 'utf-8');

        let excludedFolders = vscode.workspace.getConfiguration('coreMetrics').get('excludedFolders') as string[];

        parser.parseString(xml, (err: any, res: any) => {
            // Loop through the array
            var id: number = 1;

            // Only fetch the members
            var matches = xpath.find(res, '//Members/Method');
            matches.forEach((_: any) => {
                let skip: boolean = false;

                // Check if the folder needs to be skipped.
                if (excludedFolders.length > 0) {
                    excludedFolders.forEach((folder: string) => {
                        if (_.$.File.includes(`${folder}\\`)) {
                            skip = true;
                        }
                    });
                }

                // Add if not skipped
                if (skip === false) {
                    methods.push({
                        id  : id.toString(),
                        name: _.$.Name.replace(/\(.*\)/, ''),
                        line   : Number(_.$.Line),
                        file   : _.$.File,
                        metrics: CoreAnalyzer.mapMetrics(_.Metrics)
                    });
                    id++;
                }
            });
        });

        return Promise.resolve(methods);
    }

    private static findName(name: string, metrics: any[]): number {
        // Search through the objects
        let found : any = metrics.find(x => x.$.Name == name);

        if (found === undefined) {
            return 0;
        } else {
            return Number(found.$.Value);
        }
    }

    private static mapMetrics(metrics: any): Metrics {
        let inner = metrics[0].Metric;
        var e     = {
            maintainabilityIndex: this.findName('MaintainabilityIndex', inner),
            cyclomaticComplexity: this.findName('CyclomaticComplexity', inner),
            classCoupling       : this.findName('ClassCoupling', inner),
            depthOfInheritance  : this.findName('DepthOfInheritance', inner),
            linesOfCode         : this.findName('LinesOfCode', inner),
            score               : Number(0),
            warnings            : [] as string[]
        };

        // Calculate the score
        if (e.cyclomaticComplexity >= this.maxCyclomaticComplexity) {
            e.warnings.push('CyclomaticComplexity');
            e.score += e.cyclomaticComplexity - this.maxCyclomaticComplexity;
        }
        if (e.linesOfCode >= this.maxLinesOfCode) {
            e.warnings.push('LinesOfCode');
            e.score += e.linesOfCode - this.maxLinesOfCode;
        }
        if (e.maintainabilityIndex <= this.minMaintainabilityIndex) {
            e.warnings.push('MaintainabilityIndex');
            e.score += this.minMaintainabilityIndex - e.maintainabilityIndex;
        }
        if (e.classCoupling >= this.maxClassCoupling) {
            e.warnings.push('ClassCoupling');
            e.score += e.classCoupling - this.maxClassCoupling;
        }
        return e;
    }
}