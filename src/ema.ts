/** Internal calculation of exponential moving average */
function ema(alpha: number, sample: number, prevSample: number, deltaTime: number, emaPrev: number) {
    const a = deltaTime / alpha;
    const u = Math.exp(a * -1);
    const v = (1 - u) / a;
    const emaNext = (u * emaPrev) + ((v - u) * prevSample) + ((1.0 - v) * sample);
    return emaNext;
}

/** Parameters for Ema object */
export interface IEmaParams {
    alpha: number;
    degrees?: number;
}

/** Ema object, performs recursive EMA calculation for given time series. */
export class Ema {

    private _alpha: number;
    private _degrees: number;
    private _prev_ts: number;
    private _prev_ema: number[];

    constructor(options: IEmaParams) {
        this._alpha = options.alpha;
        this._degrees = options.degrees || 1;
        this._prev_ts = null;
        this._prev_ema = [];
    }

    public add(sample: number, ts: number): void {
        if (this._prev_ema.length == 0) {
            this._prev_ts = ts;
            for (let i = 0; i <= this._degrees; i++) {
                this._prev_ema.push(sample);
            }
            return;
        }

        const new_vals = [sample];
        const ts_diff = ts - this._prev_ts;
        for (let i = 1; i <= this._degrees; i++) {
            const ema_new = ema(
                this._alpha,
                new_vals[i - 1],
                this._prev_ema[i - 1],
                ts_diff,
                this._prev_ema[i]);
            new_vals.push(ema_new);
        }
        this._prev_ema = new_vals;
        this._prev_ts = ts;
    }

    public getEmaValues(): number[] {
        return this._prev_ema.slice(0);
    }
}

export class RunningStats {
    private n: number;
    private avg: number;
    private m2: number;

    constructor() {
        this.n = 0;
        this.avg = 0;
        this.m2 = 0;
    }

    public add(x: number): void {
        this.n++;
        const delta = x - this.avg;
        this.avg += delta / this.n;
        const delta2 = x - this.avg;
        this.m2 += delta * delta2;
    }

    public getAvg(): number { return this.avg; }
    public getVar(): number {
        if (this.n < 2) { return 0; }
        return this.m2 / (this.n - 1);
    }
    public getStdDev(): number { return Math.sqrt(this.getVar()); }
    public getStats() {
        return {
            avg: this.getAvg(),
            stdDev: this.getStdDev(),
            var: this.getVar()
        };
    }
}

export class ZScore {
    private stats: RunningStats;

    constructor() {
        this.stats = new RunningStats();
    }

    public add(x: number): number {

        // prior variance
        const curr = this.stats.getStats();

        this.stats.add(x);

        // return result
        if (curr.var == 0) { return NaN; }
        return (x - curr.avg) / curr.stdDev;
    }

    public test(x: number): number {
        const curr = this.stats.getStats();
        if (curr.var == 0) { return NaN; }
        return (x - curr.avg) / curr.stdDev;
    }
}

/** Parameters for Ema object */
export interface IEmaSimpleParams {
    alpha: number;
}

/** Ema object, performs EMA calculation ignoring the time component. */
export class EmaSimple {

    private alpha: number;
    private prev_ema: number;
    private counter: number;

    constructor(options: IEmaSimpleParams) {
        this.alpha = options.alpha;
        this.prev_ema = 0;
        this.counter = 0;
    }

    public add(sample: number): number {
        if (this.counter++ == 0) {
            this.prev_ema = sample;
        } else {
            this.prev_ema = this.alpha * sample + (1 - this.alpha) * this.prev_ema;
        }
        return this.prev_ema;
    }
}
