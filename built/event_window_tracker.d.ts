import { IEvent, IEventWindow } from "./data_objects";
export interface IEventWindowTrackerParams {
    window_len?: number;
    step?: number;
}
/** This class receives events and calculates their windows */
export declare class EventWindowTracker {
    private window;
    private initialized;
    private start_d;
    private start_dd;
    private end_d;
    private window_len;
    private step;
    constructor(options?: IEventWindowTrackerParams);
    addEvent(event: IEvent): IEventWindow[];
    private addEventInternal;
    getCurrentWindow(): IEventWindow;
    private advanceWindowByStep;
}
