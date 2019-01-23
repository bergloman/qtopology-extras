import { TsPointN, LearningExampleDense, TsPoint } from "./data_objects";
import { Triplet } from "./utils";
import { Ema } from "./ema";

/** 
 * Class that performs resampling to predefined intervals,
 * using the last value.
 */
export class Resampler {

    private lastVal: TsPointN;
    private period: number;
    private next: number;

    constructor(period: number) {
        this.period = period;
        this.lastVal = null;
        this.next = -1;
    }

    public add(rec: TsPointN): TsPointN[] {
        const res: TsPointN[] = [];
        if (this.lastVal) {
            while (this.next <= rec.ts) {
                res.push({ ts: this.next, val: this.lastVal.val });
                this.next += this.period;
            }
        } else {
            this.next = (Math.floor(rec.ts / this.period) + 1) * this.period;
        }
        this.lastVal = rec;
        return res;
    }
}

/** Class that tracks equidistant time-series and calculates features for it. */
export class TimeseriesWindowHandler {

    private window: number[];
    private winLen: number;
    private ema: Ema;

    constructor(win_len: number, degrees?: number) {
        this.window = [];
        this.winLen = win_len;
        this.ema = new Ema({ alpha: 0.5, degrees: degrees || 2 });
    }

    public isReady(): boolean {
        return (this.window.length >= this.winLen);
    }

    public add(rec: TsPointN): void {
        this.window.push(rec.val);
        this.ema.add(rec.val, rec.ts);
        if (this.window.length > this.winLen) {
            this.window = this.window.slice(this.window.length - this.winLen);
        }
    }

    public getTimeSeriesFeatures(): number[] {
        if (this.window.length < this.winLen) {
            return null;
        }

        const res: number[] = this.ema.getEmaValues();
        let avg: number = 0;
        for (let val of this.window) {
            avg += val;
        }
        avg /= this.winLen;
        res.push(avg);

        return res;
    }
}

/** internal typr for storing time-series-prediction data */
type TimeSeriesPredictionData = {
    features: number[];
    ts: number;
    futureValues: number[];
}

/** This class tracks time-series, resamples it and 
 * generates data for prediction - e.g. feature and future horizons
 */
export class TimeSeriesPredictionDataCollector {

    private data: TimeSeriesPredictionData[];
    private featureCalculator: TimeseriesWindowHandler;
    private resampler: Resampler;
    private futureWinLen: number;

    constructor(period: number) {
        this.data = [];
        this.featureCalculator = new TimeseriesWindowHandler(6, 3);
        this.resampler = new Resampler(period);
        this.futureWinLen = 6;
    }

    public addVal(rec: TsPointN): void {
        const new_recs = this.resampler.add(rec);
        for (const new_rec of new_recs) {
            this.addValInternal(new_rec);
        }
    }

    addValInternal(rec: TsPointN): void {
        for (let i = 1; i <= this.futureWinLen; i++) {
            if (this.data.length - i < 0) {
                break;
            }
            this.data[this.data.length - i].futureValues.push(rec.val);
        }
        this.featureCalculator.add(rec);
        if (this.featureCalculator.isReady()) {
            this.data.push({
                features: this.featureCalculator.getTimeSeriesFeatures(),
                futureValues: [],
                ts: rec.ts
            });
        }
    }

    public getCompleteData(): TimeSeriesPredictionData[] {
        return this.data.filter(x => x.futureValues.length == this.futureWinLen);
    }
}

/** Time-series predictor */
export class TimeSeriesPredictor {

    private dataWindow: TsPointN[];
    private data_x: LearningExampleDense[];
    private useDayOfWeek: boolean;
    private useHourOfDay: boolean;
    private useHourOfWeek: boolean;
    private minData: number;

    /** Simple constructor */
    constructor() {
        this.dataWindow = [];
        this.data_x = [];
        this.useDayOfWeek = true;
        this.useHourOfDay = true;
        this.useHourOfWeek = true;
        this.minData = 100;
    }

    /** Signals if predictor is ready to give predictions */
    public isReady(): boolean {
        return (this.data_x.length > this.minData);
    }

    public add(p: TsPoint): void {

        const rec: number[] = this.createTimestampFeatures(p.ts);
        this.dataWindow.push({ ts: p.ts.getTime(), val: p.val });
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
        if (this.useDayOfWeek) {
            for (let i = 0; i < 7; i++) {
                rec.push(i === d.val1 ? 1 : 0);
            }
        }
        if (this.useHourOfDay) {
            for (let i = 0; i < 24; i++) {
                rec.push(i === d.val2 ? 1 : 0);
            }
        }
        if (this.useHourOfWeek) {
            for (let i = 0; i < 24 * 7; i++) {
                rec.push(i === d.val3 ? 1 : 0);
            }
        }
        return rec;
    }
}
