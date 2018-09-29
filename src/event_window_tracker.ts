import { IEvent, IEventWindow, IEventCounts } from "./data_objects";

interface IEventInternal extends IEvent {
    ts_d: number;
}

export interface IEventWindowTrackerParams {
    window_len?: number;
    step?: number;
}

/** This class receives events and calculates their windows */
export class EventWindowTracker {

    private window: IEventInternal[];
    private initialized: boolean;
    private start_d: number;
    private start_dd: number;
    private end_d: number;
    private window_len: number;
    private step: number;

    constructor(options?: IEventWindowTrackerParams) {
        options = options || {};
        this.window = [];
        this.initialized = false;
        this.start_d = 0;
        this.start_dd = 0;
        this.end_d = 0;
        this.window_len = options.window_len || 10 * 60 * 1000;
        this.step = options.step || this.window_len;
    }

    addEvent(event: IEvent): IEventWindow[] {
        let d = event.ts.getTime();
        let dd = Math.floor(d / this.step);
        let res: IEventWindow[] = [];

        // uninitialized window, special case
        if (!this.initialized) {
            this.initialized = true;
            this.start_dd = dd;
            this.start_d = this.step * this.start_dd;
            this.end_d = this.start_d + this.window_len;
            this.addEventInternal(event);
            return res;
        }

        // emit windows until we reach event's timestamp
        while (dd > this.start_dd) {
            res.push(this.getCurrentWindow());
            this.advanceWindowByStep();
        }

        this.addEventInternal(event);
        return res;
    }

    private addEventInternal(event: IEvent): void {
        this.window.push({
            name: event.name,
            ts: event.ts,
            ts_d: event.ts.getTime()
        });
    }

    getCurrentWindow(): IEventWindow {
        if (!this.initialized) {
            return null;
        }
        let map: IEventCounts = {};
        for (let e of this.window) {
            if (!map[e.name]) {
                map[e.name] = 1;
            } else {
                map[e.name]++;
            }
        }
        return {
            ts_start: new Date(this.start_d),
            ts_end: new Date(this.end_d),
            names: map
        };
    }

    private advanceWindowByStep(): void {
        this.start_dd++;
        this.start_d = this.step * this.start_dd;
        this.end_d += this.step;
        this.window = this.window
            .filter(x => x.ts_d >= this.start_d);
    }
}
