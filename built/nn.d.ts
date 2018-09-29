import { EventDictionary } from "./event_dictionary";
import { IEventCounts } from "./data_objects";
export interface NNParams {
    dictionary?: EventDictionary;
    min_len: number;
    max_len: number;
    k?: number;
}
export declare class NN {
    private dictionary;
    private min_len;
    private max_len?;
    private window;
    private curr_index;
    private k;
    constructor(params?: NNParams);
    getDistance(w: IEventCounts, auto_add?: boolean): number;
    private createSpareVector;
    add(w: IEventCounts): void;
    private addInternal;
    private distanceInternal;
}
