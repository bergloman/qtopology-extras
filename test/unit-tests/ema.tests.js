"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const ema = require("../../built/ema");
const bolts = require("../../built/bolts/bolt_regularizator");

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

describe('RunningStats', function () {
    describe('simple', function () {
        it('0 data points', function () {
            let target = new ema.RunningStats();
            assert.deepEqual(target.getStats(), { avg: 0, stdDev: 0, var: 0 });
        });
        it('1 data point', function () {
            let target = new ema.RunningStats();
            target.add(1);
            assert.deepEqual(target.getStats(), { avg: 1, stdDev: 0, var: 0 });
        });
        it('9 data points', function () {
            let target = new ema.RunningStats();
            target.add(1);
            target.add(2);
            assert.deepEqual(target.getStats(), { avg: 1.5, stdDev: Math.sqrt(0.5), var: 0.5 });
            target.add(3);
            assert.deepEqual(target.getStats(), { avg: 2, stdDev: 1, var: 1 });
            target.add(4);
            assert.deepEqual(target.getStats(), { avg: 2.5, stdDev: Math.sqrt(5 / 3), var: 5 / 3 });
            target.add(5);
            assert.deepEqual(target.getStats(), { avg: 3, stdDev: Math.sqrt(2.5), var: 2.5 });
            target.add(6);
            assert.deepEqual(target.getStats(), { avg: 3.5, stdDev: Math.sqrt(3.5), var: 3.5 });
            target.add(7);
            assert.deepEqual(target.getStats(), { avg: 4, stdDev: Math.sqrt(14 / 3), var: 14 / 3 });
            target.add(8);
            assert.deepEqual(target.getStats(), { avg: 4.5, stdDev: Math.sqrt(6), var: 6 });
            target.add(9);
            assert.deepEqual(target.getStats(), { avg: 5, stdDev: Math.sqrt(7.5), var: 7.5 });
        });
    });
});

describe('ZScore', function () {
    describe('simple', function () {
        it('9 data points', function () {
            let target = new ema.ZScore();
            target.add(1);
            target.add(2);
            assertUtils.approxEqual(target.add(3), 2.121320344);
            assertUtils.approxEqual(target.add(4), 2);
            assertUtils.approxEqual(target.add(5), 1.936491673);
            assertUtils.approxEqual(target.add(6), 1.897366596);
            assertUtils.approxEqual(target.add(7), 1.870828693);
            assertUtils.approxEqual(target.add(8), 1.8516402);
            assertUtils.approxEqual(target.add(9), 1.837117307);

        });
    });
});


describe('EmaBolt', function () {
    describe('simple', function () {
        it('1 data', function (done) {
            const inner = async () => {
                let target = new bolts.EmaBolt();
                const val = 0.7973296976365404;
                await target.init(
                    "test",
                    {
                        onEmit: async (data, stream_id) => {
                            assert.ok(stream_id == null);
                            assert.strictEqual(data.value, val);
                        }
                    },
                    {});
                await target.receive(
                    {
                        "name": "server=srvr1.service=serviceA.a",
                        "ts": "2017-01-02T17:20:00.000Z",
                        "value": val
                    },
                    null);
            };
            inner()
                .then(done)
                .catch(done);
        });
    });
});
