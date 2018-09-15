/**
 * Quantile anomaly detector, using QMiner's GK algorithm.
 * NOT WORKING ATM
 */
export declare class QuantileAD {
    private gk;
    constructor();
    add(sample: number): void;
    test(sample: number): any;
}
/**
 * Quantile anomaly detector, using public TDigest library.
 */
export declare class QuantileAD2 {
    private td;
    private cnt_before_active;
    private threshold_low;
    private threshold_high;
    constructor(min_count: number, threshold_low: number, threshold_high: number);
    add(sample: number): void;
    test(sample: number): any;
}
