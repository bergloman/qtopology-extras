export declare class ADProviderTestResult {
    is_anomaly: boolean;
    cdf: number;
    sample: number;
}
export interface IADProviderScalar {
    add(sample: number): void;
    test(sample: number): ADProviderTestResult;
}
export interface IADProviderScalarFactory {
    create(): IADProviderScalar;
}
export declare class ADEngineScalar {
    private factory;
    private detectors;
    constructor(factory: IADProviderScalarFactory);
    add(name: string, sample: number): void;
    test(name: string, sample: number): any;
}
export declare class DummyADScalar implements IADProviderScalar {
    private calls;
    private results;
    constructor(results: ADProviderTestResult[]);
    add(sample: number): void;
    test(sample: number): ADProviderTestResult;
    getCalls(): number[];
}
