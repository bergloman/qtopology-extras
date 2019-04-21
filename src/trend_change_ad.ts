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
}

export class TrendChangeDetection {

    private window_short: TimeseriesWindow;
    private window_long: TimeseriesWindow;

    constructor(short: number, long: number) {
        this.window_long = new TimeseriesWindow(long);
        this.window_short = new TimeseriesWindow(short);
    }

    public add(rec: TsPointN) {
        const transitions = this.window_short.add(rec);
        for (const x of transitions) {
            this.window_long.add(x);
        }
    }

    public isAnomaly(): boolean {
        const res = mwut.test(
            this.window_short.getVals(),
            this.window_long.getVals(),
            "two-sided"
        );
        return res.p < 0.01;
    }
}
