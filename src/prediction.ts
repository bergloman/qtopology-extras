import * as ema from "./ema";
import * as qm from "qminer";

const analytics = qm.analytics;
const la = qm.la;

export interface SingleSeriesPredictionParams {
    degree?: number;
    n?: number;
}

export class SingleSeriesPrediction {

    private _ema: ema.Ema;
    private _counter: number;
    private _lin_reg: any;

    constructor(options: SingleSeriesPredictionParams) {
        options = options || {};
        const deg = options.degree || 2;
        const N = options.n || 10;
        this._ema = new ema.Ema({ alpha: 2 / (1 + N), degrees: deg });
        this._lin_reg = new analytics.RecLinReg({ dim: 1 + deg });
        this._counter = 0;
    }

    add(sample, ts) {
        // first update linear regression
        if (this._counter > 10) {
            let vals = new la.Vector(this._ema.getEmaValues());
            this._lin_reg.partialFit(vals, sample);
        }

        // now update averages
        this._ema.add(sample, ts);
        this._counter++;
    }

    test(sample, ts) {
        if (this._counter < 2) return null;
        let vals = new la.Vector(this._ema.getEmaValues());
        let prediction = this._lin_reg.predict(vals);
        return { ts, sample, prediction };
    }

    getCounter() { return this._counter; }
    getEmaValues() { return this._ema.getEmaValues(); }
}
