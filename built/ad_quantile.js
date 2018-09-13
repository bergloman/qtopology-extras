"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qm = require("qminer");
const tdigest = require("tdigest");
/**
 * Quantile anomaly detector, using QMiner's GK algorithm.
 * NOT WORKING ATM
 */
class QuantileAD {
    constructor() {
        this.gk = new qm.analytics.quantiles.Gk({ eps: 0.0001, autoCompress: true });
    }
    add(sample) {
        this.gk.insert(sample);
    }
    test(sample) {
        //let cdf = this.gk.cdf(sample);
        let cdf = this.gk.quantile(sample);
        return {
            is_anomaly: (cdf < 0.02 || cdf > 0.98),
            cdf: cdf
        };
    }
}
exports.QuantileAD = QuantileAD;
/**
 * Quantile anomaly detector, using public TDigest library.
 */
class QuantileAD2 {
    constructor(threshold_low, threshold_high) {
        this.td = new tdigest.TDigest();
        this.threshold_low = threshold_low;
        this.threshold_high = threshold_high;
    }
    add(sample) {
        this.td.push(sample);
    }
    test(sample) {
        let cdf = this.td.p_rank(sample);
        return {
            is_anomaly: (this.threshold_low != null && cdf < this.threshold_low) ||
                (this.threshold_high != null && cdf > this.threshold_high),
            cdf: cdf
        };
    }
}
exports.QuantileAD2 = QuantileAD2;
