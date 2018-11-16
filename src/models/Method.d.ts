import { Metrics } from "./Metrics.d";

export class Method {
    id     : string;
    name   : string;
    line   : number;
    file   : string;
    metrics: Metrics;
}