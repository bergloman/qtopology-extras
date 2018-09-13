
export class ADProviderTestResult {
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

export class ADEngineScalar {

    private factory: IADProviderScalarFactory;
    private detectors: Map<string, IADProviderScalar>;

    constructor(factory: IADProviderScalarFactory) {
        this.detectors = new Map<string, IADProviderScalar>();
        this.factory = factory;
    }

    add(name: string, sample: number): void {
        if (!this.detectors.has(name)) {
            this.detectors.set(name, this.factory.create());
        }
        this.detectors.get(name).add(sample);
    }

    test(name: string, sample: number): any {
        if (!this.detectors.has(name)) {
            this.detectors.set(name, this.factory.create());
        }
        return this.detectors.get(name).test(sample);
    }
}

export class DummyADScalar implements IADProviderScalar {
    private calls: number[];
    private results: ADProviderTestResult[];
    constructor(results: ADProviderTestResult[]) {
        this.calls = [];
        this.results = results;
    }
    add(sample: number): void {
        this.calls.push(sample);
    }
    test(sample: number): ADProviderTestResult {
        let res = this.results[0];
        res.sample = sample;
        this.results = this.results.slice(1);
        return res;
    }

    getCalls() { return this.calls.slice(); }
}
