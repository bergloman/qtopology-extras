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
