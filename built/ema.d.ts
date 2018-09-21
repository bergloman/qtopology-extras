/** Parameters for Ema object */
export interface EmaParams {
    alpha: number;
    degrees?: number;
}
/** Ema object, performs recursive EMA calculation for given time series. */
export declare class Ema {
    private _alpha;
    private _degrees;
    private _prev_ts;
    private _prev_ema;
    constructor(options: EmaParams);
    add(sample: number, ts: number): void;
    getEmaValues(): number[];
}
export declare class RunningStats {
    private n;
    private avg;
    private m2;
    constructor();
    add(x: number): void;
    getAvg(): number;
    getVar(): number;
    getStdDev(): number;
    getStats(): {
        avg: number;
        stdDev: number;
        var: number;
    };
}
export declare class ZScore {
    private stats;
    constructor();
    add(x: number): number;
}
export declare class ZScoreAD {
}
