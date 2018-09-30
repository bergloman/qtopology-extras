"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qm = require("qminer");
const tdigest = require("tdigest");
const ema_1 = require("./ema");
/** Result for qunatile anomaly detector */
class QuantileADResult {
}
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
        let threshold_cdf_low = 0.02;
        let threshold_cdf_high = 0.98;
        let res = {
            is_anomaly: (cdf < threshold_cdf_low) || (cdf > threshold_cdf_high),
            sample: sample,
            cdf: cdf,
            threshold_cdf_low: threshold_cdf_low,
            threshold_cdf_high: threshold_cdf_high,
            values: {
                sample: sample,
                cdf: cdf,
                threshold_cdf_low: threshold_cdf_low,
                threshold_cdf_high: threshold_cdf_high
            }
        };
        return res;
    }
}
exports.QuantileAD = QuantileAD;
/**
 * Quantile anomaly detector, using public TDigest library.
 */
class QuantileAD2 {
    constructor(min_count, threshold_low, threshold_high) {
        this.td = new tdigest.TDigest();
        this.cnt_before_active = min_count;
        this.threshold_cdf_low = threshold_low;
        this.threshold_cdf_high = threshold_high;
    }
    add(sample) {
        this.td.push(sample);
        if (this.cnt_before_active > 0) {
            this.cnt_before_active--;
        }
    }
    test(sample) {
        let cdf = this.td.p_rank(sample);
        let res = {
            is_anomaly: (this.cnt_before_active > 0) && ((cdf < this.threshold_cdf_low) ||
                (cdf > this.threshold_cdf_high)),
            sample: sample,
            cdf: cdf,
            threshold_cdf_low: this.threshold_cdf_low,
            threshold_cdf_high: this.threshold_cdf_high,
            values: {
                sample: sample,
                cdf: cdf,
                threshold_cdf_low: this.threshold_cdf_low,
                threshold_cdf_high: this.threshold_cdf_high
            }
        };
        return res;
    }
}
exports.QuantileAD2 = QuantileAD2;
/** Result of z-score anomaly detector */
class ZScoreADResult {
}
/**
 * ZScore anomaly detector.
 */
class ZScoreAD {
    constructor(min_count, threshold_z_pos, threshold_z_neg) {
        this.cnt_before_active = min_count;
        this.threshold_z_pos = threshold_z_pos;
        this.threshold_z_neg = threshold_z_neg;
        this.zs = new ema_1.ZScore();
    }
    add(sample) {
        if (this.cnt_before_active > 0) {
            this.cnt_before_active--;
        }
        this.zs.add(sample);
    }
    test(x) {
        let z = this.zs.test(x);
        let res = {
            is_anomaly: (this.cnt_before_active > 0) && ((this.threshold_z_pos && z > this.threshold_z_pos) ||
                (this.threshold_z_neg && z < this.threshold_z_neg)),
            sample: x,
            z: z,
            threshold_z_pos: this.threshold_z_pos,
            threshold_z_neg: this.threshold_z_neg,
            values: {
                sample: x,
                z: z,
                threshold_z_pos: this.threshold_z_pos,
                threshold_z_neg: this.threshold_z_neg
            }
        };
        return res;
    }
}
exports.ZScoreAD = ZScoreAD;
