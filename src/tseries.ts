import { TsPointN, LearningExampleDense, TsPoint } from "./data_objects";
import { Triplet } from "./utils";
import { Ema } from "./ema";


export class Resampler {

    private last_val: TsPointN;
    private period: number;
    private next: number;

    constructor(period: number) {
        this.period = period;
        this.last_val = null;
        this.next = -1;
    }

    public add(rec: TsPointN): TsPointN[] {
        const res: TsPointN[] = [];
        if (this.last_val) {
            while (this.next <= rec.ts) {
                res.push({ ts: this.next, val: this.last_val.val });
                this.next += this.period;
            }
        } else {
            this.next = (Math.floor(rec.ts / this.period) + 1) * this.period;
        }
        this.last_val = rec;
        return res;
    }
}

export class TimeseriesWindowHandler {

    private window: number[];
    private win_len: number;
    private ema: Ema;

    constructor(win_len: number, degrees?: number) {
        this.window = [];
        this.win_len = win_len;
        this.ema = new Ema({ alpha: 0.2, degrees: degrees || 2 });
    }

    public isReady(): boolean {
        return (this.window.length >= this.win_len);
    }

    public add(rec: TsPointN): void {
        this.window.push(rec.val);
        this.ema.add(rec.val, rec.ts);
        if (this.window.length > this.win_len) {
            this.window = this.window.slice(this.window.length - this.win_len);
        }
    }

    public get(): number[] {
        if (this.window.length < this.win_len) {
            return null;
        }

        const res: number[] = this.ema.getEmaValues();
        let avg: number = 0;
        for (let val of this.window) {
            avg += val;
        }
        avg /= this.win_len;
        res.push(avg);

        return res;
    }
}

/** Time-series predictor */
export class TimeSeriesPredictor {

    private data_window: TsPointN[];
    private data_x: LearningExampleDense[];
    private use_day_of_week: boolean;
    private use_hour_of_day: boolean;
    private use_hour_of_week: boolean;
    private min_data: number;

    /** Simple constructor */
    constructor() {
        this.data_window = [];
        this.data_x = [];
        this.use_day_of_week = true;
        this.use_hour_of_day = true;
        this.use_hour_of_week = true;
        this.min_data = 100;
    }

    /** Signals if predictor is ready to give predictions */
    public isReady(): boolean {
        return (this.data_x.length > this.min_data);
    }

    public add(p: TsPoint): void {

        const rec: number[] = this.createTimestampFeatures(p.ts);
        this.data_window.push({ ts: p.ts.getTime(), val: p.val });
        this.data_x.push({ val1: rec, val2: p.val });

        if (this.isReady()) {
            // TODO generate model
        }
    }

    public predict(_ts: Date): number {
        //const rec: number[] = this.createTimestampFeatures(ts);
        return 0;
    }

    /** Decodes timestamp into basic indicators */
    private getTimestampVals(ts: Date): Triplet<number, number, number> {
        return {
            val1: ts.getUTCDay(),
            val2: ts.getUTCHours(),
            val3: 24 * ts.getUTCDay() + ts.getUTCHours()
        };
    }

    /** Creates timestam features - features that describe time component */
    private createTimestampFeatures(ts: Date) {
        const d = this.getTimestampVals(ts);
        const rec: number[] = [];
        if (this.use_day_of_week) {
            for (let i = 0; i < 7; i++) {
                rec.push(i === d.val1 ? 1 : 0);
            }
        }
        if (this.use_hour_of_day) {
            for (let i = 0; i < 24; i++) {
                rec.push(i === d.val2 ? 1 : 0);
            }
        }
        if (this.use_hour_of_week) {
            for (let i = 0; i < 24 * 7; i++) {
                rec.push(i === d.val3 ? 1 : 0);
            }
        }
        return rec;
    }
}
