"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const pca = require("../../built/ad_pca");
const tt = require("./test-utils");

describe('PCA', function () {
    describe('PcaModel', function () {
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
            target.train([data0, data1, data2])
            const res = target.getReconstructionError(data0);
            tt.approxEqual(res, 0.33333, 0.0001);
        });
    });
});
