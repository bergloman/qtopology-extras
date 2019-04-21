"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const tca = require("../../built/trend_change_ad");

describe.only("Trend change AD", function () {
    describe("simple", function () {
        it("test 1", function () {
            let ts = 1;
            let counter = 0;
            const WINDOW = 50;
            const ROTATION = 5;
            let ad = new tca.TrendChangeDetection(WINDOW, 2 * WINDOW);
            for (let i = 0; i < 3 * WINDOW; i++) {
                ad.add({ ts: ts++, val: counter % ROTATION });
                counter++;
            }
            // at this point, both windows are (almost) the same
            assert.ok(!ad.isAnomaly());

            for (let i = 0; i < WINDOW; i++) {
                ad.add({ ts: ts++, val: 1 + (counter % ROTATION) });
                counter++;
            }
            // now, the short window has significantly different distirbution
            assert.ok(ad.isAnomaly());
        });
    });
});
