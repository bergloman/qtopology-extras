export interface SingleSeriesPredictionParams {
    degree?: number;
    n?: number;
}
export declare class SingleSeriesPrediction {
    private _ema;
    private _counter;
    private _lin_reg;
    constructor(options: SingleSeriesPredictionParams);
    add(sample: any, ts: any): void;
    test(sample: any, ts: any): {
        ts: any;
        sample: any;
        prediction: any;
    };
    getCounter(): number;
    getEmaValues(): number[];
}
