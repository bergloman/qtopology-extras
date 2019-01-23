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
        assert.deepEqual(res, [{ ts: 20, val: 10 }]);
    });
    it('2 data points - distant interval', function () {
        let target = new ts.Resampler(10);
        let res = target.add({ ts: 12, val: 10 });
        assert.deepEqual(res, []);
        res = target.add({ ts: 42, val: 20 });
        assert.deepEqual(res,
            [
                { ts: 20, val: 10 },
                { ts: 30, val: 10 },
                { ts: 40, val: 10 }
            ]
        );
    });
});


describe('TSeries - TimeseriesWindowHandler', function () {
    it('no data', function () {
        let target = new ts.TimeseriesWindowHandler();
    });
    it('3 data points', function () {
        let target = new ts.TimeseriesWindowHandler(3);
        target.add({ ts: 1, val: 10 });
        assert.ok(!target.isReady());
        target.add({ ts: 2, val: 10 });
        assert.ok(!target.isReady());
        target.add({ ts: 3, val: 10 });
        assert.ok(target.isReady());
        assert.deepEqual(target.get(), [10, 10, 10, 10]);
    });
    it('3 data points', function () {
        let target = new ts.TimeseriesWindowHandler(3);
        target.add({ ts: 1, val: 10 });
        assert.ok(!target.isReady());
        target.add({ ts: 2, val: 20 });
        assert.ok(!target.isReady());
        target.add({ ts: 3, val: 30 });
        assert.ok(target.isReady());
        assert.deepEqual(target.get(), [30, 28, 26, 20]);
    });
});
