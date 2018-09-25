"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Internal calculation of exponential moving average */
function ema(alpha, sample, prevSample, deltaTime, emaPrev) {
    let a = deltaTime / alpha;
    let u = Math.exp(a * -1);
    let v = (1 - u) / a;
    let emaNext = (u * emaPrev) + ((v - u) * prevSample) + ((1.0 - v) * sample);
    return emaNext;
}
/** Ema object, performs recursive EMA calculation for given time series. */
class Ema {
    constructor(options) {
        this._alpha = options.alpha;
        this._degrees = options.degrees || 1;
        this._prev_ts = null;
        this._prev_ema = [];
    }
    add(sample, ts) {
        if (this._prev_ema.length == 0) {
            this._prev_ts = ts;
            for (let i = 0; i <= this._degrees; i++) {
                this._prev_ema.push(sample);
            }
            return;
        }
        let new_vals = [sample];
        let ts_diff = ts - this._prev_ts;
        for (let i = 1; i <= this._degrees; i++) {
            let ema_new = ema(this._alpha, new_vals[i - 1], this._prev_ema[i - 1], ts_diff, this._prev_ema[i]);
            new_vals.push(ema_new);
        }
        this._prev_ema = new_vals;
        this._prev_ts = ts;
    }
    getEmaValues() {
        return this._prev_ema.slice(0);
    }
}
exports.Ema = Ema;
class RunningStats {
    constructor() {
        this.n = 0;
        this.avg = 0;
        this.m2 = 0;
    }
    add(x) {
        this.n++;
        const delta = x - this.avg;
        this.avg += delta / this.n;
        const delta2 = x - this.avg;
        this.m2 += delta * delta2;
    }
    getAvg() { return this.avg; }
    getVar() {
        if (this.n < 2)
            return 0;
        return this.m2 / (this.n - 1);
    }
    getStdDev() { return Math.sqrt(this.getVar()); }
    getStats() {
        return {
            avg: this.getAvg(),
            stdDev: this.getStdDev(),
            var: this.getVar()
        };
    }
}
exports.RunningStats = RunningStats;
class ZScore {
    constructor() {
        this.stats = new RunningStats();
    }
    add(x) {
        // prior variance
        const curr = this.stats.getStats();
        this.stats.add(x);
        //return result
        if (curr.var == 0)
            return NaN;
        return (x - curr.avg) / curr.stdDev;
    }
    test(x) {
        const curr = this.stats.getStats();
        if (curr.var == 0)
            return NaN;
        return (x - curr.avg) / curr.stdDev;
    }
}
exports.ZScore = ZScore;
