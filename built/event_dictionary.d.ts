import * as qm from "qminer";
import { IEventCounts } from ".";
/** This class contains dictionary for mapping events to numerics */
export declare class EventDictionary {
    counter: number;
    map: qm.ht.StrIntMap;
    inv_map: qm.ht.IntStrMap;
    constructor();
    /**
     * This method maps event window summary to sparse vector.
     * @param data Event window summary
     */
    createSparseVec(data: IEventCounts): number[][];
    /** Get event name for dimension */
    getName(dim: number): string;
    /**
     * Maps event name to dimension
     * @param name Event name
     */
    getDim(name: string): number;
}
