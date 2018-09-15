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
    private cnt_before_active: number;
    private threshold_low: number;
    private threshold_high: number;

    constructor(min_count: number, threshold_low: number, threshold_high: number) {
        this.td = new tdigest.TDigest();
        this.cnt_before_active = min_count;
        this.threshold_low = threshold_low;
        this.threshold_high = threshold_high;
    }

    add(sample: number): void {
        this.td.push(sample);
        if (this.cnt_before_active > 0) {
            this.cnt_before_active--;
        }
    }

    test(sample: number): any {
        let cdf = this.td.p_rank(sample);
        if (this.cnt_before_active > 0) {
            return { is_anomaly: false, cdf: cdf };
        }
        return {
            is_anomaly:

                (cdf < this.threshold_low) ||
                (cdf > this.threshold_high),
            cdf: cdf
        };
    }
}

