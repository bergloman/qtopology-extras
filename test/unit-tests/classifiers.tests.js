"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const c = require("../../built/classifiers");
const tt = require("./test-utils");

describe('classifiers', function () {
    describe('SparseVecClassifierSVC', function () {
        describe('simple', function () {
            it('creatable', function () {
                const target = new c.SparseVecClassifierSVC();
            });
            it('2 examples', function () {
                const data = [
                    { val1: [[0, 1]], val2: 1 },
                    { val1: [[1, 1]], val2: -1 },
                    { val1: [[2, 1]], val2: -1 }
                ];

                const target = new c.SparseVecClassifierSVC();
                const classifier = target.build(data);

                const res = classifier.classify([[0, 1], [2, 0]]);
                assert.equal(res, 1);
                const res2 = classifier.classify([[0, 1]]);
                assert.equal(res2, 1);
            });
        });
    });
    describe('RidgeRegression', function () {
        describe('simple', function () {
            it('creatable', function () {
                const target = new c.RidgeRegression();
            });
            it('1D examples', function () {
                const data = [
                    { val1: [0], val2: 0 },
                    { val1: [1], val2: 1 },
                    { val1: [2], val2: 0 },
                    { val1: [3], val2: 2 },
                    { val1: [4], val2: 1 }
                ];

                const target = new c.RidgeRegression();
                const regression = target.build(data);

                for (let d of data) {
                    console.log(d.val2, regression.predict(d.val1));
                }
            });
            it('2D examples', function () {
                const data = [
                    { val1: [0, 0], val2: 1 },
                    { val1: [0, 1], val2: 1 },
                    { val1: [1, 0], val2: -1 },
                    { val1: [1, 1], val2: 1 },
                    { val1: [2, 1], val2: -1 }
                ];

                const target = new c.RidgeRegression();
                const regression = target.build(data);

                const res = regression.predict([0, 1]);
                console.log(res);
                const res2 = regression.predict([2, 1]);
                console.log(res2);
            });
        });
    });
});
