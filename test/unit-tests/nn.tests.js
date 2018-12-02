"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const nn = require("../../built/nn");
const tt = require("./test-utils");

describe('NN', function () {
    describe('Normalized', function () {
        describe('simple', function () {
            it('creatable', function () {
                let target = new nn.NN({});
            });
            it('add single', function () {
                let target = new nn.NN({});
                target.add({ a: 2, b: 3 });
            });
            it('add single and test distances', function () {
                let target = new nn.NN({});
                target.add({ a: 2, b: 3 });
                assert.deepStrictEqual(target.getDistance({ a: 2, b: 3 }), { distance: 0, k: 1, input: { a: 2, b: 3 }, kNearest: { a: 2, b: 3 } });
                assert.deepStrictEqual(target.getDistance({ c: 2, d: 3 }).distance, 1);
                tt.approxEqual(target.getDistance({ a: 2, c: 3 }).distance, 0.69230769230, 0.000001);
            });
            it('add single and test distances', function () {
                let target = new nn.NN({});
                target.add({ a: 1, b: 1 });
                tt.approxEqual(target.getDistance({ a: 1, c: 1 }).distance, 0.5, 0.000001);
                tt.approxEqual(target.getDistance({ a: 2, c: 3 }).distance, 0.60776773, 0.000001);
            });
            it('add single and test distances, under min_len', function () {
                let target = new nn.NN({ min_len: 5 });
                target.add({ a: 2, b: 3 });
                assert.strictEqual(target.getDistance({ a: 2, b: 3 }).distance, -1);
            });
        });
        describe('complex', function () {
            it('add three', function () {
                let target = new nn.NN({ k: 2 });
                target.add({ a: 1 });
                target.add({ b: 2 });
                target.add({ c: 3 });
                assert.strictEqual(target.getDistance({ a: 2, d: 3 }).distance, 1);
            });
            it('add three', function () {
                let target = new nn.NN({});
                target.add({ a: 1 });
                target.add({ b: 2 });
                target.add({ c: 3 });
            });
            it('add three and test distances', function () {
                let target = new nn.NN({});
                target.add({ a: 1 });
                target.add({ b: 2 });
                target.add({ c: 3 });
                assert.strictEqual(target.getDistance({ a: 2 }).distance, 0);
                assert.strictEqual(target.getDistance({ b: 3 }).distance, 0);
                assert.strictEqual(target.getDistance({ c: 4 }).distance, 0);
                tt.approxEqual(target.getDistance({ a: 1, b: 1, c: 1 }).distance, 0.4226497308103, 0.000001);
            });
            it('add three with auto_add, without min_len', function () {
                let target = new nn.NN();
                assert.strictEqual(target.getDistance({ a: 1 }, true).distance, 0);
                assert.strictEqual(target.getDistance({ b: 2 }, true).distance, 1);
                assert.strictEqual(target.getDistance({ c: 3 }, true).distance, 1);
                tt.approxEqual(target.getDistance({ a: 1, b: 1, c: 1 }).distance, 0.4226497308103, 0.000001);
            });
            it('add three with auto_add, with min_len', function () {
                let target = new nn.NN({ min_len: 2 });
                assert.strictEqual(target.getDistance({ a: 1 }, true).distance, -1);
                assert.strictEqual(target.getDistance({ b: 2 }, true).distance, -1);
                assert.strictEqual(target.getDistance({ c: 3 }, true).distance, 1);
                tt.approxEqual(target.getDistance({ a: 1, b: 1, c: 1 }).distance, 0.4226497308103, 0.000001);
            });
            // it('add sequence', function () {
            //     let examples = [
            //         { "ts_start": "2017-06-19T17:49:17.000Z", "ts_end": "2017-06-19T17:49:17.002Z", "names": { "e1": 1 } },
            //         { "ts_start": "2017-06-19T17:49:17.002Z", "ts_end": "2017-06-19T17:49:17.004Z", "names": { "e1": 1 } },
            //         { "ts_start": "2017-06-19T17:49:17.004Z", "ts_end": "2017-06-19T17:49:17.006Z", "names": { "e2": 1 } },
            //         { "ts_start": "2017-06-19T17:49:17.006Z", "ts_end": "2017-06-19T17:49:17.008Z", "names": { "e1": 1 } },
            //         { "ts_start": "2017-06-19T17:49:17.008Z", "ts_end": "2017-06-19T17:49:17.010Z", "names": { "e1": 1, "e2": 1 } },
            //         { "ts_start": "2017-06-19T17:49:17.010Z", "ts_end": "2017-06-19T17:49:17.012Z", "names": { "e1": 1 } },
            //         { "ts_start": "2017-06-19T17:49:17.012Z", "ts_end": "2017-06-19T17:49:17.014Z", "names": { "e1": 1, "e2": 2, "e3": 1 } }
            //     ];
            //     let target = new nn.NN({});
            //     for (let e of examples) {
            //         console.log(e.names, target.getDistance(e.names, true));
            //     }
            // });
            it('bugfixing 1', function () {
                let target = new nn.NN({});
                let obj = { "ts_start": "2013-12-31T23:00:00.000Z", "ts_end": "2013-12-31T23:30:00.000Z", "names": { "passenger_count": 1, "passenger_count.payment_type=CSH": 1, "passenger_count.payment_type=CSH.rate_code=1": 1, "passenger_count.payment_type=CSH.rate_code=1.vendor=VTS": 2, "passenger_count.payment_type=CSH.rate_code=1.vendor=CMT": 2, "passenger_count.payment_type=CSH.vendor=VTS": 2, "passenger_count.payment_type=CSH.vendor=CMT": 2, "passenger_count.rate_code=1": 1, "passenger_count.rate_code=1.vendor=VTS": 2, "passenger_count.rate_code=1.vendor=CMT": 2, "passenger_count.vendor=VTS": 2, "passenger_count.payment_type=CRD": 2, "passenger_count.payment_type=CRD.rate_code=1": 2, "passenger_count.payment_type=CRD.rate_code=1.vendor=VTS": 2, "passenger_count.payment_type=CRD.rate_code=1.vendor=CMT": 2, "passenger_count.payment_type=CRD.vendor=VTS": 2, "passenger_count.payment_type=CRD.vendor=CMT": 2, "passenger_count.payment_type=CRD.rate_code=5": 1, "passenger_count.payment_type=CRD.rate_code=5.vendor=VTS": 1, "passenger_count.payment_type=UNK": 1, "passenger_count.payment_type=UNK.rate_code=1": 1, "passenger_count.payment_type=UNK.rate_code=1.vendor=VTS": 1, "passenger_count.payment_type=UNK.vendor=VTS": 1, "passenger_count.vendor=CMT": 2, "passenger_count.payment_type=DIS": 2, "passenger_count.payment_type=DIS.rate_code=1": 2, "passenger_count.payment_type=DIS.rate_code=1.vendor=CMT": 2, "passenger_count.payment_type=DIS.vendor=CMT": 2, "passenger_count.rate_code=5": 1, "passenger_count.rate_code=5.vendor=VTS": 1, "total_amount": 2, "total_amount.payment_type=CSH": 2, "total_amount.payment_type=CSH.rate_code=1": 2, "total_amount.payment_type=CSH.rate_code=1.vendor=VTS": 2, "total_amount.payment_type=CSH.rate_code=1.vendor=CMT": 2, "total_amount.payment_type=CSH.vendor=VTS": 2, "total_amount.payment_type=CSH.vendor=CMT": 2, "total_amount.rate_code=1": 2, "total_amount.rate_code=1.vendor=VTS": 2, "total_amount.rate_code=1.vendor=CMT": 2, "total_amount.vendor=VTS": 2, "total_amount.payment_type=CRD": 2, "total_amount.payment_type=CRD.rate_code=1": 2, "total_amount.payment_type=CRD.rate_code=1.vendor=VTS": 2, "total_amount.payment_type=CRD.rate_code=1.vendor=CMT": 2, "total_amount.payment_type=CRD.vendor=VTS": 2, "total_amount.payment_type=CRD.vendor=CMT": 2, "total_amount.payment_type=CRD.rate_code=5": 2, "total_amount.payment_type=CRD.rate_code=5.vendor=VTS": 1, "total_amount.payment_type=UNK": 2, "total_amount.payment_type=UNK.rate_code=1": 2, "total_amount.payment_type=UNK.rate_code=1.vendor=VTS": 2, "total_amount.payment_type=UNK.vendor=VTS": 2, "total_amount.vendor=CMT": 2, "total_amount.payment_type=DIS": 1, "total_amount.payment_type=DIS.rate_code=1": 1, "total_amount.payment_type=DIS.rate_code=1.vendor=CMT": 1, "total_amount.payment_type=DIS.vendor=CMT": 1, "total_amount.payment_type=NOC": 2, "total_amount.payment_type=NOC.rate_code=1": 2, "total_amount.payment_type=NOC.rate_code=1.vendor=CMT": 2, "total_amount.payment_type=NOC.vendor=CMT": 2, "total_amount.rate_code=5": 1, "total_amount.rate_code=5.vendor=VTS": 2, "total_amount.rate_code=2": 2, "total_amount.rate_code=2.vendor=CMT": 2, "trip_distance": 2, "trip_distance.payment_type=CSH": 2, "trip_distance.payment_type=CSH.rate_code=1": 2, "trip_distance.payment_type=CSH.rate_code=1.vendor=VTS": 2, "trip_distance.payment_type=CSH.rate_code=1.vendor=CMT": 2, "trip_distance.payment_type=CSH.vendor=VTS": 2, "trip_distance.payment_type=CSH.vendor=CMT": 2, "trip_distance.rate_code=1": 2, "trip_distance.rate_code=1.vendor=VTS": 2, "trip_distance.rate_code=1.vendor=CMT": 2, "trip_distance.vendor=VTS": 2, "trip_distance.payment_type=CRD": 2, "trip_distance.payment_type=CRD.rate_code=1": 2, "trip_distance.payment_type=CRD.rate_code=1.vendor=VTS": 2, "trip_distance.payment_type=CRD.rate_code=1.vendor=CMT": 2, "trip_distance.payment_type=CRD.vendor=VTS": 2, "trip_distance.payment_type=CRD.vendor=CMT": 2, "trip_distance.payment_type=UNK": 2, "trip_distance.payment_type=UNK.rate_code=1": 2, "trip_distance.payment_type=UNK.rate_code=1.vendor=VTS": 2, "trip_distance.payment_type=UNK.vendor=VTS": 2, "trip_distance.vendor=CMT": 2, "trip_distance.payment_type=DIS": 1, "trip_distance.payment_type=DIS.rate_code=1": 1, "trip_distance.payment_type=DIS.rate_code=1.vendor=CMT": 1, "trip_distance.payment_type=DIS.vendor=CMT": 1, "trip_distance.payment_type=NOC": 2, "trip_distance.payment_type=NOC.rate_code=1": 2, "trip_distance.payment_type=NOC.rate_code=1.vendor=CMT": 2, "trip_distance.payment_type=NOC.vendor=CMT": 2, "trip_distance.rate_code=5": 2, "trip_distance.rate_code=5.vendor=VTS": 2, "trip_distance.rate_code=2": 2, "trip_distance.rate_code=2.vendor=CMT": 2, "passenger_count.payment_type=CRD.rate_code=5.vendor=CMT": 1, "passenger_count.payment_type=CRD.rate_code=2": 1, "passenger_count.payment_type=CSH.rate_code=5": 1, "passenger_count.payment_type=CSH.rate_code=2": 1, "passenger_count.payment_type=NOC": 1, "passenger_count.payment_type=NOC.rate_code=1": 1, "passenger_count.payment_type=NOC.rate_code=1.vendor=CMT": 1, "passenger_count.payment_type=NOC.vendor=CMT": 1, "passenger_count.rate_code=2": 1, "total_amount.payment_type=CRD.rate_code=5.vendor=CMT": 1, "total_amount.payment_type=CRD.rate_code=2": 1, "total_amount.payment_type=CRD.rate_code=2.vendor=CMT": 1, "total_amount.payment_type=CSH.rate_code=5": 1, "total_amount.payment_type=CSH.rate_code=2": 1, "total_amount.rate_code=5.vendor=CMT": 1, "trip_distance.payment_type=CRD.rate_code=5": 1, "trip_distance.payment_type=CRD.rate_code=5.vendor=VTS": 1, "trip_distance.payment_type=CRD.rate_code=5.vendor=CMT": 1, "trip_distance.payment_type=CRD.rate_code=2": 1, "trip_distance.payment_type=CRD.rate_code=2.vendor=CMT": 1, "trip_distance.payment_type=CSH.rate_code=5": 1, "trip_distance.payment_type=CSH.rate_code=2": 1, "trip_distance.rate_code=5.vendor=CMT": 1, "trip_distance.payment_type=NOC.rate_code=2": 1, "trip_distance.payment_type=NOC.rate_code=2.vendor=CMT": 1 } };
                assert.strictEqual(target.getDistance(obj.names, true).distance, 0);
                //tt.approxEqual(target.getDistance({ a: 1, b: 1, c: 1 }), 0.4226497308103, 0.000001);
                tt.approxEqual(target.getDistance({ a: 1, b: 1, c: 1 }).distance, 1, 0.000001);
            });
        });
    });

    describe('NonNormalized', function () {
        describe('simple', function () {
            it('creatable', function () {
                let target = new nn.NNDense({normalize: true});
            });
            it('add single', function () {
                let target = new nn.NNDense({normalize: true});
                target.add({ a: 2, b: 3 });
            });
            it('add single and test distances', function () {
                let target = new nn.NNDense({normalize: true});
                target.add({ a: 2, b: 3 });
                assert.deepStrictEqual(target.getDistance({ a: 2, b: 3 }), { distance: 0, k: 1, input: { a: 2, b: 3 }, kNearest: { a: 2, b: 3 } });
                tt.approxEqual(target.getDistance({ c: 2, d: 3 }).distance, 5.09902, 0.00001);
                tt.approxEqual(target.getDistance({ a: 2, c: 3 }).distance, 4.242641, 0.00001);
            });
            it('add single and test distances', function () {
                let target = new nn.NNDense({normalize: true});
                target.add({ a: 1, b: 1 });
                tt.approxEqual(target.getDistance({ a: 1, c: 1 }).distance, 1.414214, 0.000001);
                tt.approxEqual(target.getDistance({ a: 2, c: 3 }).distance, 3.316625, 0.000001);
            });
            it('add single and test distances, under min_len', function () {
                let target = new nn.NNDense({ min_len: 5, normalize: true });
                target.add({ a: 2, b: 3 });
                assert.strictEqual(target.getDistance({ a: 2, b: 3 }).distance, -1);
            });
        });
    });
});
