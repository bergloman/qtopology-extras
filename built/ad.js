"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ADEngineScalar {
    constructor(factory) {
        this.detectors = new Map();
        this.factory = factory;
    }
    add(name, sample) {
        if (!this.detectors.has(name)) {
            this.detectors.set(name, this.factory.create());
        }
        this.detectors.get(name).add(sample);
    }
    test(name, sample) {
        if (!this.detectors.has(name)) {
            this.detectors.set(name, this.factory.create());
        }
        return this.detectors.get(name).test(sample);
    }
}
exports.ADEngineScalar = ADEngineScalar;
class DummyADScalar {
    constructor(results) {
        this.calls = [];
        this.results = results;
    }
    add(sample) {
        this.calls.push(sample);
    }
    test(_sample) {
        let res = this.results[0];
        this.results = this.results.slice(1);
        return res;
    }
    getCalls() { return this.calls.slice(); }
}
exports.DummyADScalar = DummyADScalar;
