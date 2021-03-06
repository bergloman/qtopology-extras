"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const ts = require("../../built/tseries");

describe('TSeries - Resampler', function () {
    it('no data', function () {
        let target = new ts.Resampler(10);
    });
    it('1 data point', function () {
        let target = new ts.Resampler(10);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
    });
    it('2 data points - same interval', function () {
        let target = new ts.Resampler(10);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
        res = target.add({ ts: 14, val: 10 });
        assert.deepEqual(res, []);
    });
    it('2 data points - subsequent interval', function () {
        let target = new ts.Resampler(10);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
        res = target.add({ ts: 22, val: 20 });
        assert.deepEqual(res, [{ ts: 2, val: 10 }]);
    });
    it('2 data points - distant interval', function () {
        let target = new ts.Resampler(10);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
        res = target.add({ ts: 42, val: 20 });
        assert.deepEqual(res,
            [
                { ts: 2, val: 10 },
                { ts: 3, val: 10 },
                { ts: 4, val: 10 }
            ]
        );
    });
});

describe('TSeries - Regularizator', function () {
    it('no data', function () {
        let target = new ts.Regularizator(10);
    });
    it('1 data point', function () {
        let target = new ts.Regularizator(1, false);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
        res = target.add({ ts: 14, val: 10 });
        assert.deepEqual(res, [{ ts: 14, val: 0.5 }]);
    });
    it('1 data point - re-emit', function () {
        let target = new ts.Regularizator(1, true);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, [{ ts: 12, val: 0.5 }]);
        res = target.add({ ts: 14, val: 10 });
        assert.deepEqual(res, [{ ts: 14, val: 0.5 }]);
    });
    it('2 data points - no re-emit', function () {
        let target = new ts.Regularizator(2, false);
        let res = target.add({ ts: 1, val: 10 });
        assert.deepEqual(res, []);
        let res2 = target.add({ ts: 2, val: 20 });
        assert.deepEqual(res2, []);
        let res3 = target.add({ ts: 3, val: 20 });
        assert.strictEqual(res3.length, 1);
        assert.strictEqual(res3[0].ts, 3);
        assertUtils.approxEqual(res3[0].val, 0.735702, 0.00001);
    });
    it('2 data points - re-emit', function () {
        let target = new ts.Regularizator(2, true);
        let res = target.add({ ts: 1, val: 10 });
        assert.deepEqual(res, []);
        let res2 = target.add({ ts: 2, val: 20 });
        assert.strictEqual(res2.length, 2);
        assert.strictEqual(res2[0].ts, 1);
        assertUtils.approxEqual(res2[0].val, 0.264298, 0.00001);
        assert.strictEqual(res2[1].ts, 2);
        assertUtils.approxEqual(res2[1].val, 0.735702, 0.00001);
    });
});

describe('TSeries - Normalizer', function () {
    it('no data', function () {
        let target = new ts.Normalizator(10);
    });
    it('1 data point - no re-emit', function () {
        let target = new ts.Normalizator(1, false);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
        res = target.add({ ts: 14, val: 10 });
        assert.deepEqual(res, [{ ts: 14, val: 0 }]);
    });
    it('1 data point - re-emit', function () {
        let target = new ts.Normalizator(1, true);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, [{ ts: 12, val: 0 }]);
    });
    it('2 data points - no re-emit', function () {
        let target = new ts.Normalizator(2, false);
        let res = target.add({ ts: 1, val: 10 });
        assert.deepEqual(res, []);
        let res2 = target.add({ ts: 2, val: 20 });
        assert.strictEqual(res2.length, 0);
        res2 = target.add({ ts: 3, val: 20 });
        assert.strictEqual(res2.length, 1);
        assert.strictEqual(res2[0].ts, 3);
        assertUtils.approxEqual(res2[0].val, Math.sqrt(2) / 2, 0.00001);
    });
    it('2 data points - no re-emit implicit', function () {
        let target = new ts.Normalizator(2);
        let res = target.add({ ts: 1, val: 10 });
        assert.deepEqual(res, []);
        let res2 = target.add({ ts: 2, val: 20 });
        assert.strictEqual(res2.length, 0);
        res2 = target.add({ ts: 3, val: 20 });
        assert.strictEqual(res2.length, 1);
        assert.strictEqual(res2[0].ts, 3);
        assertUtils.approxEqual(res2[0].val, Math.sqrt(2) / 2, 0.00001);
    });
    it('2 data points - re-emit', function () {
        let target = new ts.Normalizator(2, true);
        let res = target.add({ ts: 1, val: 10 });
        assert.deepEqual(res, []);
        let res2 = target.add({ ts: 2, val: 20 });
        assert.strictEqual(res2.length, 2);
        assert.strictEqual(res2[0].ts, 1);
        assertUtils.approxEqual(res2[0].val, -Math.sqrt(2) / 2, 0.00001);
        assert.strictEqual(res2[1].ts, 2);
        assertUtils.approxEqual(res2[1].val, Math.sqrt(2) / 2, 0.00001);
    });
});

describe('TSeries - TimeseriesWindowHandler', function () {
    it('no data', function () {
        let target = new ts.TimeseriesWindowHandler();
    });
    it('3 data points - same', function () {
        let target = new ts.TimeseriesWindowHandler(3);
        target.add({ ts: 1, val: 10 });
        assert.ok(!target.isReady());
        target.add({ ts: 2, val: 10 });
        assert.ok(!target.isReady());
        target.add({ ts: 3, val: 10 });
        assert.ok(target.isReady());
        const res = target.getTimeSeriesFeatures();
        assert.deepEqual(res.length, 4 + 7 + 24);
        assert.deepEqual(res.slice(0, 4), [10, 10, 10, 10]);
    });
    it('3 data points - different', function () {
        let target = new ts.TimeseriesWindowHandler(3);
        target.add({ ts: 1, val: 10 });
        assert.ok(!target.isReady());
        target.add({ ts: 2, val: 20 });
        assert.ok(!target.isReady());
        target.add({ ts: 3, val: 30 });
        assert.ok(target.isReady());

        const res = target.getTimeSeriesFeatures();
        assert.deepEqual(res.length, 4 + 24 + 7);
        assert.deepEqual(res[0], 30);
        assertUtils.approxEqual(res[1], 25.0916, 0.0001);
        assertUtils.approxEqual(res[2], 20.6891, 0.0001);
        assert.deepEqual(res[3], 20);
    });
});

describe('TSeries - TimeSeriesPredictionDataCollector', function () {
    it('some data', function () {
        const MINUTE = 60 * 1000;
        let target = new ts.TimeSeriesPredictionDataCollector(2 * MINUTE);

        for (let i = 0; i < 20; i++) {
            target.addVal({ ts: 5 * MINUTE * i, val: Math.sin(i / 2) });
        }

        //console.log(JSON.stringify(target, null, "  "));
        const complete_data = target.getCompleteData();
        //console.log(complete_data);
        for (let r of complete_data) {
            console.log(r.features.map(x => "" + x).join(","));
        }
    });
});
