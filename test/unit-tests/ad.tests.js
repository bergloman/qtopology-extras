"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const ad = require("../../built/ad");

class DummyADFactory {
    constructor(inner) { this.inner = inner; }
    create() { return this.inner; }
}

describe('AD', function () {
    describe('AD simple', function () {
        it('no data', function () {
            let ad_obj = new ad.DummyADScalar([
                //{ is_anomaly: false, cdf: 0, sample: 0 }
            ]);
            let target = new ad.ADEngineScalar(new DummyADFactory(ad_obj));
            assert.equal(ad_obj.getCalls().length, 0);
        });
        it('single', function () {
            let val1 = 0.876;
            let ad_obj = new ad.DummyADScalar([
                { is_anomaly: false, cdf: 0.55, sample: 0 }
            ]);
            let target = new ad.ADEngineScalar(new DummyADFactory(ad_obj));
            target.add("name1", val1);
            let calls = ad_obj.getCalls();
            assert.equal(calls.length, 1);
            assert.deepEqual(calls[0], val1);
        });
    });
});
