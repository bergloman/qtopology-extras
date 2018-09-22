import { IADProviderScalar } from "./ad";
/**
 * Quantile anomaly detector, using QMiner's GK algorithm.
 * NOT WORKING ATM
 */
export declare class QuantileAD implements IADProviderScalar {
    private gk;
    constructor();
    add(sample: number): void;
    test(sample: number): any;
}
/**
 * Quantile anomaly detector, using public TDigest library.
 */
export declare class QuantileAD2 implements IADProviderScalar {
    private td;
    private cnt_before_active;
    private threshold_low;
    private threshold_high;
    constructor(min_count: number, threshold_low: number, threshold_high: number);
    add(sample: number): void;
    test(sample: number): any;
}
/**
 * ZScore anomaly detector.
 */
export declare class ZScoreAD implements IADProviderScalar {
    private cnt_before_active;
    private threshold_z_pos?;
    private threshold_z_neg?;
    private zs;
    constructor(min_count: number, threshold_z_pos?: number, threshold_z_neg?: number);
    add(sample: number): void;
    test(x: number): any;
}
