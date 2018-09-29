export interface IADProviderTestResult {
    is_anomaly: boolean;
    sample: number;
}
export interface IADProviderScalar {
    add(sample: number): void;
    test(sample: number): IADProviderTestResult;
}
export interface IADProviderScalarFactory {
    create(): IADProviderScalar;
}
export declare class ADEngineScalar {
    private factory;
    private detectors;
    constructor(factory: IADProviderScalarFactory);
    add(name: string, sample: number): void;
    test(name: string, sample: number): IADProviderTestResult;
}
export declare class DummyADScalar implements IADProviderScalar {
    private calls;
    private results;
    constructor(results: IADProviderTestResult[]);
    add(sample: number): void;
    test(sample: number): IADProviderTestResult;
    getCalls(): number[];
}
