import { TsPointN } from "./data_objects";
import * as mwut from "./mannwhitneyutest";

/** Class that tracks equidistant time-series and calculates features for it. */
class TimeseriesWindow {

    private window: TsPointN[];
    private winLen: number;
    private curr_ts: number;
    private ready: boolean;

    constructor(win_len: number) {
        this.window = [];
        this.winLen = win_len;
        this.curr_ts = -1;
        this.ready = false;
    }

    /** Check if this object is ready to emit data */
    public isReady(): boolean {
        return this.ready;
    }

    /** Adds new timepoint into internal storage */
    public add(rec: TsPointN): TsPointN[] {
        this.curr_ts = rec.ts;
        this.window.push(rec);

        const limit_ts = this.curr_ts - this.winLen;
        let i = 0;
        while (this.window[i].ts < limit_ts) {
            i++;
        }
        if (i > 0) {
            const res = this.window.slice(0, i);
            this.window = this.window.slice(i);
            return res;
        } else {
            return [];
        }
    }

    /** Returns all completed data */
    public getVals(): number[] {
        return this.window.map(x => x.val);
    }

    /** Returns the length of collected data */
    public getLength(): number {
        return this.window.length;
    }
}

export class LongtermChangeDetection {

    private window_short: TimeseriesWindow;
    private window_long: TimeseriesWindow;
    private last_result: mwut.IMannWhitneyUTestResult;
    private initialized: boolean;

    constructor(short: number, long: number) {
        this.window_long = new TimeseriesWindow(long);
        this.window_short = new TimeseriesWindow(short);
        this.last_result = null;
        this.initialized = false;
    }

    public add(rec: TsPointN) {
        const transitions = this.window_short.add(rec);
        let removed_from_long = 0;
        for (const x of transitions) {
            const obsolete = this.window_long.add(x);
            removed_from_long += obsolete.length;
        }
        this.initialized = this.initialized || (removed_from_long > 0);
    }

    public isAnomaly(): boolean {
        if (!this.initialized) {
            return false;
        }
        this.last_result = mwut.test(
            this.window_short.getVals(),
            this.window_long.getVals(),
            "two-sided"
        );
        return this.last_result.p < 0.01;
    }

    public getLastAnomalyResults(): any {
        return this.last_result;
    }
}
