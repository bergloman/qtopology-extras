import { IGdrValues } from "./data_objects";

export interface IADProviderTestResult {
    is_anomaly: boolean;
    values: IGdrValues;
    extra_data?: any;
}

export interface IADProviderScalar {
    add(sample: number): void;
    test(sample: number): IADProviderTestResult;
}

export interface IADProviderScalarFactory {
    create(): IADProviderScalar;
}

export class ADEngineScalar {

    private factory: IADProviderScalarFactory;
    private detectors: Map<string, IADProviderScalar>;

    constructor(factory: IADProviderScalarFactory) {
        this.detectors = new Map<string, IADProviderScalar>();
        this.factory = factory;
    }

    public add(name: string, sample: number): void {
        if (!this.detectors.has(name)) {
            this.detectors.set(name, this.factory.create());
        }
        this.detectors.get(name).add(sample);
    }

    public test(name: string, sample: number): IADProviderTestResult {
        if (!this.detectors.has(name)) {
            this.detectors.set(name, this.factory.create());
        }
        return this.detectors.get(name).test(sample);
    }
}

export class DummyADScalar implements IADProviderScalar {
    private calls: number[];
    private results: IADProviderTestResult[];
    constructor(results: IADProviderTestResult[]) {
        this.calls = [];
        this.results = results;
    }
    public add(sample: number): void {
        this.calls.push(sample);
    }
    public test(_sample: number): IADProviderTestResult {
        const res = this.results[0];
        this.results = this.results.slice(1);
        return res;
    }

    public getCalls() { return this.calls.slice(); }
}
