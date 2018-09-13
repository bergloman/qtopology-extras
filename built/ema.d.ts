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
