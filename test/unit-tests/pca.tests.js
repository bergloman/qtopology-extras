"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const pca = require("../../built/ad_pca");
const tt = require("./test-utils");

describe.only('PCA', function () {
    describe('PcaModel', function () {
        //         describe('simple', function () {
        it('creatable', function () {
            const target = new pca.PcaModel(0.5);
        });
        it('test non-initialized', function () {
            const target = new pca.PcaModel(0.5);
            const res = target.getReconstructionError({ a: 1 });
            assert.equal(res, 0);
        });
        it('test add 1', function () {
            const target = new pca.PcaModel(0.5);
            const data0 = { a: 1 };
            const data1 = { a: 2, b: 1 };
            const data2 = { a: 1, b: 2 };
            target.retrain([data0, data1, data2])
            const res = target.getReconstructionError(data0);
            tt.approxEqual(res, 0.33333, 0.0001);
        });
        //             it('2 examples', function () {
        //                 const data = [
        //                     { val1: [[0, 1]], val2: 1 },
        //                     { val1: [[1, 1]], val2: -1 },
        //                     { val1: [[2, 1]], val2: -1 }
        //                 ];

        //                 const target = new c.SparseVecClassifierSVC();
        //                 const classifier = target.build(data);

        //                 const res = classifier.classify([[0, 1], [2, 0]]);
        //                 assert.equal(res, 1);
        //                 const res2 = classifier.classify([[0, 1]]);
        //                 assert.equal(res2, 1);
        //             });
        //         });
        //     });
        //     describe('RidgeRegression', function () {
        //         describe('simple', function () {
        //             it('creatable', function () {
        //                 const target = new c.RidgeRegression();
        //             });
        //             it('1D examples', function () {
        //                 const data = [
        //                     { val1: [0], val2: 0 },
        //                     { val1: [1], val2: 1 },
        //                     { val1: [2], val2: 0 },
        //                     { val1: [3], val2: 2 },
        //                     { val1: [4], val2: 1 }
        //                 ];

        //                 const target = new c.RidgeRegression();
        //                 const regression = target.build(data);

        //                 for (let d of data) {
        //                     console.log(d.val2, regression.predict(d.val1));
        //                 }
        //             });
        //             it('2D examples', function () {
        //                 const data = [
        //                     { val1: [0, 0], val2: 1 },
        //                     { val1: [0, 1], val2: 1 },
        //                     { val1: [1, 0], val2: -1 },
        //                     { val1: [1, 1], val2: 1 },
        //                     { val1: [2, 1], val2: -1 }
        //                 ];

        //                 const target = new c.RidgeRegression();
        //                 const regression = target.build(data);

        //                 const res = regression.predict([0, 1]);
        //                 console.log(res);
        //                 const res2 = regression.predict([2, 1]);
        //                 console.log(res2);
        //             });
        //         });
    });
});
