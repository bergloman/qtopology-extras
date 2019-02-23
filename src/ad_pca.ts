import * as qm from "qminer";
import { IGdrValues, IEventCounts } from "./data_objects";

/** Result for qunatile anomaly detector */
class PcaADResult implements IADProviderTestResult {
    public is_anomaly: boolean;
    public values: IGdrValues;
    public distance: number;
}

/**
 * PCA anomaly detector, using qminer implementation.
 */
export class PcaAD {

    private cnt_before_active: number;
    private cnt_before_retrain: number;
    private is_active: boolean;

    constructor(cnt_before_active: number, cnt_before_retrain: number) {
        this.cnt_before_active = cnt_before_active;
        this.cnt_before_retrain = cnt_before_retrain;
        this.is_active = (this.cnt_before_active > 0);
    }

    public add(sample: IEventCounts): void {
        // add sample to internal list

        // if need to retrain
        //     retrain, new model, 

        this.td.push(sample);
        if (!this.is_active) {
            this.cnt_before_active--;
            this.is_active = (this.cnt_before_active > 0);
        }
    }

    public test(sample: IEventCounts): IADProviderTestResult {
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
