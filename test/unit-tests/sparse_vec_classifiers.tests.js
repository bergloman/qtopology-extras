"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const c = require("../../built/sparse_vec_classifiers");
const tt = require("./test-utils");

describe('SparseVec classifiers', function () {
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
            });
        });
    });
});
