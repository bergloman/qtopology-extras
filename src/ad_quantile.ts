import * as qm from "qminer";
import * as tdigest from "tdigest";
import { IADProviderScalar, IADProviderTestResult } from "./ad";
import { ZScore } from "./ema";
import { IGdrValues } from "./data_objects";

/** Result for qunatile anomaly detector */
class QuantileADResult implements IADProviderTestResult {
    public is_anomaly: boolean;
    public values: IGdrValues;
    public sample: number;
    public cdf: number;
    public threshold_cdf_low: number;
    public threshold_cdf_high: number;
}

/**
 * Quantile anomaly detector, using QMiner's GK algorithm.
 * NOT WORKING ATM
 */
export class QuantileAD implements IADProviderScalar {

    private gk: any;

    constructor() {
        this.gk = new qm.analytics.quantiles.Gk({ eps: 0.0001, autoCompress: true });
    }

    public add(sample: number): void {
        this.gk.insert(sample);
    }

    public test(sample: number): any {
        // let cdf = this.gk.cdf(sample);
        const cdf = this.gk.quantile(sample);
        const threshold_cdf_low = 0.02;
        const threshold_cdf_high = 0.98;
        const res: QuantileADResult = {
            cdf,
            is_anomaly: (cdf < threshold_cdf_low) || (cdf > threshold_cdf_high),
            sample,
            threshold_cdf_high,
            threshold_cdf_low,
            values: {
                cdf,
                sample,
                threshold_cdf_high,
                threshold_cdf_low
            }
        };
        return res;
    }
}

/**
 * Quantile anomaly detector, using public TDigest library.
 */
export class QuantileAD2 implements IADProviderScalar {

    private td: any;
    private cnt_before_active: number;
    private is_active: boolean;
    private threshold_cdf_low: number;
    private threshold_cdf_high: number;

    constructor(min_count: number, threshold_low: number, threshold_high: number) {
        this.td = new tdigest.TDigest();
        this.cnt_before_active = min_count;
        this.is_active = (this.cnt_before_active > 0);
        this.threshold_cdf_low = threshold_low;
        this.threshold_cdf_high = threshold_high;
    }

    public add(sample: number): void {
        this.td.push(sample);
        if (!this.is_active) {
            this.cnt_before_active--;
            this.is_active = (this.cnt_before_active > 0);
        }
    }

    public test(sample: number): IADProviderTestResult {
        const cdf = this.td.p_rank(sample);
        const res: QuantileADResult = {
            cdf,
            is_anomaly:
                this.is_active && (
                    (cdf < this.threshold_cdf_low) ||
                    (cdf > this.threshold_cdf_high)
                ),
            sample,
            threshold_cdf_high: this.threshold_cdf_high,
            threshold_cdf_low: this.threshold_cdf_low,
            values: {
                cdf,
                sample,
                threshold_cdf_high: this.threshold_cdf_high,
                threshold_cdf_low: this.threshold_cdf_low
            }
        };
        return res;
    }
}

/** Result of z-score anomaly detector */
class ZScoreADResult implements IADProviderTestResult {
    public is_anomaly: boolean;
    public values: IGdrValues;
    public sample: number;
    public z: number;
    public threshold_z_pos: number;
    public threshold_z_neg: number;
}

/**
 * ZScore anomaly detector.
 */
export class ZScoreAD implements IADProviderScalar {

    private cnt_before_active: number;
    private threshold_z_pos?: number;
    private threshold_z_neg?: number;
    private zs: ZScore;

    constructor(min_count: number, threshold_z_pos?: number, threshold_z_neg?: number) {
        this.cnt_before_active = min_count;
        this.threshold_z_pos = threshold_z_pos;
        this.threshold_z_neg = threshold_z_neg;
        this.zs = new ZScore();
    }

    public add(sample: number): void {
        if (this.cnt_before_active > 0) {
            this.cnt_before_active--;
        }
        this.zs.add(sample);
    }

    public test(x: number): IADProviderTestResult {
        const z = this.zs.test(x);
        const res: ZScoreADResult = {
            is_anomaly:
                (this.cnt_before_active > 0) && (
                    (this.threshold_z_pos && z > this.threshold_z_pos) ||
                    (this.threshold_z_neg && z < this.threshold_z_neg)
                ),
            sample: x,
            threshold_z_neg: this.threshold_z_neg,
            threshold_z_pos: this.threshold_z_pos,
            values: {
                sample: x,
                threshold_z_neg: this.threshold_z_neg,
                threshold_z_pos: this.threshold_z_pos,
                z
            },
            z
        };
        return res;
    }
}
