import * as qm from "qminer";
import * as tdigest from "tdigest";

/**
 * Quantile anomaly detector, using QMiner's GK algorithm.
 * NOT WORKING ATM
 */
export class QuantileAD {

    private gk: any;

    constructor() {
        this.gk = new qm.analytics.quantiles.Gk({ eps: 0.0001, autoCompress: true });
    }

    add(sample: number): void {
        this.gk.insert(sample);
    }

    test(sample: number): any {
        //let cdf = this.gk.cdf(sample);
        let cdf = this.gk.quantile(sample);
        return {
            is_anomaly: (cdf < 0.02 || cdf > 0.98),
            cdf: cdf
        };
    }
}

/**
 * Quantile anomaly detector, using public TDigest library.
 */
export class QuantileAD2 {

    private td: any;
    private threshold_low: number;
    private threshold_high: number;

    constructor(threshold_low: number, threshold_high: number) {
        this.td = new tdigest.TDigest();
        this.threshold_low = threshold_low;
        this.threshold_high = threshold_high;
    }

    add(sample: number): void {
        this.td.push(sample);
    }

    test(sample: number): any {
        let cdf = this.td.p_rank(sample);
        return {
            is_anomaly:
                (cdf < this.threshold_low) ||
                (cdf > this.threshold_high),
            cdf: cdf
        };
    }
}

