import { EventDictionary } from "./event_dictionary";
import { IEventCounts } from "./data_objects";
export interface NNParams {
    dictionary?: EventDictionary;
    min_len: number;
    max_len: number;
    k?: number;
}
export interface INnResult {
    distance: number;
    k: number;
    input: IEventCounts;
    kNearest: IEventCounts;
}
export declare class NN {
    private dictionary;
    private min_len;
    private max_len?;
    private window;
    private window_n;
    private curr_index;
    private k;
    constructor(params?: NNParams);
    getDistance(w: IEventCounts, auto_add?: boolean): INnResult;
    private createSpareVector;
    add(w: IEventCounts): void;
    private addInternal;
    private distanceInternal;
}
