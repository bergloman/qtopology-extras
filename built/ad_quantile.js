"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qm = require("qminer");
const tdigest = require("tdigest");
const ema_1 = require("./ema");
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
    constructor(min_count, threshold_low, threshold_high) {
        this.td = new tdigest.TDigest();
        this.cnt_before_active = min_count;
        this.threshold_low = threshold_low;
        this.threshold_high = threshold_high;
    }
    add(sample) {
        this.td.push(sample);
        if (this.cnt_before_active > 0) {
            this.cnt_before_active--;
        }
    }
    test(sample) {
        let cdf = this.td.p_rank(sample);
        if (this.cnt_before_active > 0) {
            return { is_anomaly: false, cdf: cdf };
        }
        return {
            is_anomaly: (cdf < this.threshold_low) ||
                (cdf > this.threshold_high),
            cdf: cdf
        };
    }
}
exports.QuantileAD2 = QuantileAD2;
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
        if (this.cnt_before_active > 0) {
            return { is_anomaly: false, z: 0 };
        }
        return {
            is_anomaly: (this.threshold_z_pos && z > this.threshold_z_pos) ||
                (this.threshold_z_neg && z < this.threshold_z_neg),
            cdf: z
        };
    }
}
exports.ZScoreAD = ZScoreAD;
