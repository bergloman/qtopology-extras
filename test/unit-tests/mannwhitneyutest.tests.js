"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const mwut = require("../../built/mannwhitneyutest");

describe("MannWhitneyUTest", function () {
    describe("simple", function () {
        it("test 1", function () {

            const samples = [
                [1, 2, 1, 2, 3, 3, 2, 1, 1, 2, 3, 2, 1],
                [4, 3, 1, 3, 2, 2, 5, 3, 2, 1, 4]
            ];

            const u = mwut.test(samples[0], samples[1], "two-sided");
            assert.ok(u.p > 0.05);
        });
        it("test 2", function () {

            const samples = [
                [1, 2, 1, 2, 3, 3, 2, 1, 1, 2, 3, 2, 1],
                [4, 3, 1, 3, 5, 2, 5, 3, 2, 1, 4]
            ];

            const u = mwut.test(samples[0], samples[1], "two-sided");
            assert.ok(u.p < 0.05);
        });
    });
});
