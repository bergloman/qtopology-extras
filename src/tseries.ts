import { TsPointN, ITsPointN } from "./data_objects";
import { Triplet } from "./utils";
import { Ema, RunningStats } from "./ema";

/**
 * Class that performs resampling to predefined intervals,
 * using the last value.
 */
export class Resampler {

    private lastVal: ITsPointN;
    private period: number;
    private next: number;

    constructor(period: number) {
        this.period = period;
        this.lastVal = null;
        this.next = -1;
    }

    /** Receives a new timepoint and returns resampled array of points. */
    public add(rec: ITsPointN): ITsPointN[] {
        const res: ITsPointN[] = [];
        if (this.lastVal) {
            while (this.next <= rec.ts) {
                res.push({ ts: this.next / this.period, val: this.lastVal.val });
                this.next += this.period;
            }
        } else {
            this.next = (Math.floor(rec.ts / this.period) + 1) * this.period;
        }
        this.lastVal = rec;
        return res;
    }
}

/**
 * Class that performs regulariation - mapping to interval [0, 1].
 * Actually, it observes predefined number of values, then calculates
 * mean and variance from the samples. After that it maps all incoming data as
 *
 * y = 0.5 + (x - mean) / std_var / 3
 *
 * This means that the result might be outside [0, 1] interval, but not by much.
 */
export class Regularizator {

    private buffer: TsPointN[];
    private delay: number;
    private reemit_delay: boolean;
    private stats: RunningStats;
    private avg: number;
    private stdev: number;

    constructor(delay: number, reemit_delay?: boolean) {
        this.buffer = [];
        this.delay = delay;
        this.reemit_delay = reemit_delay;
        this.stats = new RunningStats();
        this.avg = 0;
        this.stdev = 0;
    }

    /** Receives a new timepoint and returns regularized array of points. */
    public add(rec: ITsPointN): ITsPointN[] {
        const res: ITsPointN[] = [];
        if (this.delay > 0) {
            if (this.reemit_delay) {
                this.buffer.push(rec);
            }
            this.stats.add(rec.val);
            this.delay--;
            if (this.delay == 0) {
                this.avg = this.stats.getAvg();
                this.stdev = this.stats.getStdDev();
                if (this.stdev === 0) {
                    this.stdev = 1;
                }
                this.stats = null;
                if (this.reemit_delay) {
                    this.buffer.forEach(x => {
                        res.push({ ts: x.ts, val: 0.5 + (x.val - this.avg) / this.stdev / 3 });
                    });
                    this.buffer = [];
                }
            }
        } else {
            res.push({ ts: rec.ts, val: 0.5 + (rec.val - this.avg) / this.stdev / 3 });
        }
        return res;
    }
}

/**
 * Class that performs normalization - to a distribution that has mean 0 and variance 1.
 * Actually, it observes predefined number of values, then calculates
 * mean and variance from the samples. After that it maps all incoming data as
 *
 * y = (x - mean) / std_var
 */
export class Normalizator {

    private buffer: TsPointN[];
    private delay: number;
    private reemit_delay: boolean;
    private stats: RunningStats;
    private avg: number;
    private stdev: number;

    constructor(delay: number, reemit_delay?: boolean) {
        this.buffer = [];
        this.delay = delay;
        this.reemit_delay = reemit_delay;
        this.stats = new RunningStats();
        this.avg = 0;
        this.stdev = 0;
    }

    /** Receives a new timepoint and returns normalized array of points. */
    public add(rec: ITsPointN): ITsPointN[] {
        const res: ITsPointN[] = [];
        if (this.delay > 0) {
            if (this.reemit_delay) {
                this.buffer.push(rec);
            }
            this.stats.add(rec.val);
            this.delay--;
            if (this.delay == 0) {
                this.avg = this.stats.getAvg();
                this.stdev = this.stats.getStdDev();
                if (this.stdev === 0) {
                    this.stdev = 1;
                }
                this.stats = null;
                if (this.reemit_delay) {
                    this.buffer.forEach(x => {
                        res.push({ ts: x.ts, val: (x.val - this.avg) / this.stdev });
                    });
                    this.buffer = [];
                }
            }
        } else {
            res.push({ ts: rec.ts, val: (rec.val - this.avg) / this.stdev });
        }
        return res;
    }
}

/** Class that tracks equidistant time-series and calculates features for it. */
export class TimeseriesWindowHandler {

    private window: number[];
    private winLen: number;
    private ema: Ema;
    private useDayOfWeek: boolean;
    private useHourOfDay: boolean;
    private useHourOfWeek: boolean;
    private time_features: number[];

    constructor(win_len: number, degrees?: number) {
        this.window = [];
        this.winLen = win_len;
        this.ema = new Ema({ alpha: 0.5, degrees: degrees || 2 });
        this.useDayOfWeek = true;
        this.useHourOfDay = true;
        this.useHourOfWeek = false;
    }

    /** Check if this object is tready to emit data */
    public isReady(): boolean {
        return (this.window.length >= this.winLen);
    }

    /** Adds new timepoint into internal storage */
    public add(rec: TsPointN): void {
        this.window.push(rec.val);
        this.ema.add(rec.val, rec.ts);
        if (this.window.length > this.winLen) {
            this.window = this.window.slice(this.window.length - this.winLen);
        }
        this.time_features = this.createTimestampFeatures(new Date(rec.ts));
    }

    /** Returns all completed data */
    public getTimeSeriesFeatures(): number[] {
        if (this.window.length < this.winLen) {
            return null;
        }

        // first EMA values
        const res: number[] = this.ema.getEmaValues();

        // add certain window-related features
        let avg: number = 0;
        for (const val of this.window) {
            avg += val;
        }
        avg /= this.winLen;
        res.push(avg);

        // finally, add time features
        this.time_features.forEach(x => res.push(x));

        return res;
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
    private createTimestampFeatures(ts: Date): number[] {
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

/** Internal type for storing time-series-prediction data */
class TimeSeriesPredictionData {
    public features: number[];
    public ts: number;
    public futureValues: number[];
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

    /** Add new record into learning examples */
    public addVal(rec: TsPointN): void {
        const new_recs = this.resampler.add(rec);
        for (const new_rec of new_recs) {
            this.addValInternal(new_rec);
        }
    }

    /** Retrieve all completed data points */
    public getCompleteData(): TimeSeriesPredictionData[] {
        return this.data.filter(x => x.futureValues.length == this.futureWinLen);
    }

    /** Indicates that data is ready */
    public isReady(): boolean {
        return this.featureCalculator.isReady();
    }

    /** Add new data point into internal storage */
    private addValInternal(rec: TsPointN): void {
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
}

/** Time-series predictor */
export class TimeSeriesPredictor {

    private data_collector: TimeSeriesPredictionDataCollector;

    /** Simple constructor */
    constructor() {
        this.data_collector = new TimeSeriesPredictionDataCollector(10 * 60 * 1000);
    }

    /** Signals if predictor is ready to give predictions */
    public isReady(): boolean {
        return this.data_collector.isReady();
    }

    /** Add given time-point to model */
    public add(p: TsPointN): void {

        this.data_collector.addVal(p);
        if (this.data_collector.isReady()) {
            // TODO generate model
        }
    }

    /** Perform prediction for given time-point */
    public predict(_ts: Date): number {
        // const rec: number[] = this.createTimestampFeatures(ts);
        return 0;
    }
}
