"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const ema = require("../../built/ema");

describe('Ema', function () {
    describe('Ema simple', function () {
        it('no data', function () {
            let target = new ema.Ema({ alpha: 0.1, degrees: 2 });
            assert.deepEqual(target.getEmaValues(), []);
        });
        it('1 data point', function () {
            let target = new ema.Ema({ alpha: 0.1, degrees: 2 });
            target.add(2, 10);
            assert.deepEqual(target.getEmaValues(), [2, 2, 2]);
        });
        it('2 data points - same', function () {
            let target = new ema.Ema({ alpha: 0.1, degrees: 2 });
            target.add(2, 10);
            target.add(2, 20);
            assert.deepEqual(target.getEmaValues(), [2, 2, 2]);
        });
        it('2 data points - different', function () {
            let target = new ema.Ema({ alpha: 0.1, degrees: 2 });
            target.add(2, 10);
            target.add(4, 20);
            assert.deepEqual(target.getEmaValues(), [4, 3.98, 3.9602]);
        });
        it('2 data points - different', function () {
            let target = new ema.Ema({ alpha: 1, degrees: 2 });
            target.add(2, 10);
            target.add(4, 20);
            let vals = target.getEmaValues();
            assert.equal(vals[0], 4);
            assertUtils.approxEqual(vals[1], 3.8, 0.0001);
            assertUtils.approxEqual(vals[2], 3.62, 0.0001);
        });
    });
});
