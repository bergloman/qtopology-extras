"use strict";

/*global describe, it, before, beforeEach, after, afterEach */

const assert = require("assert");
const assertUtils = require("./test-utils");
const ewt = require("../../built/event_window_tracker");

describe('EventWindowTracker', function () {
    describe('simple', function () {
        it('creatable', function () {
            let target = new ewt.EventWindowTracker();
        });
        it('empty uninitialized window', function () {
            let target = new ewt.EventWindowTracker();
            assert.equal(target.getCurrentWindow(), null);
        });
    });
    describe('single window', function () {
        it('1 data point', function () {
            let target = new ewt.EventWindowTracker({ window_len: 10 });
            let res1 = target.addEvent({ name: "a", ts: new Date(5) });
            assert.deepEqual(res1, []);
            assert.deepEqual(target.getCurrentWindow(), {
                ts_start: new Date(0),
                ts_end: new Date(10),
                names: { a: 1 }
            });
        });
        it('2 data points, same window', function () {
            let target = new ewt.EventWindowTracker({ window_len: 10 });
            let res1 = target.addEvent({ name: "a", ts: new Date(5) });
            let res2 = target.addEvent({ name: "b", ts: new Date(6) });
            assert.deepEqual(res1, []);
            assert.deepEqual(res2, []);
            assert.deepEqual(target.getCurrentWindow(), {
                ts_start: new Date(0),
                ts_end: new Date(10),
                names: { a: 1, b: 1 }
            });
        });
        it('3 data points, same window', function () {
            let target = new ewt.EventWindowTracker({ window_len: 10 });
            let res1 = target.addEvent({ name: "a", ts: new Date(5) });
            let res2 = target.addEvent({ name: "b", ts: new Date(6) });
            let res3 = target.addEvent({ name: "a", ts: new Date(7) });
            assert.deepEqual(res1, []);
            assert.deepEqual(res2, []);
            assert.deepEqual(res3, []);
            assert.deepEqual(target.getCurrentWindow(), {
                ts_start: new Date(0),
                ts_end: new Date(10),
                names: { a: 2, b: 1 }
            });
        });
    });
    describe('multiple windows', function () {
        it('2 data points, different window', function () {
            let target = new ewt.EventWindowTracker({ window_len: 10 });
            let res1 = target.addEvent({ name: "a", ts: new Date(5) });
            let res2 = target.addEvent({ name: "b", ts: new Date(16) });
            assert.deepEqual(res1, []);
            assert.deepEqual(res2, [{
                ts_start: new Date(0),
                ts_end: new Date(10),
                names: { a: 1 }
            }]);
            assert.deepEqual(target.getCurrentWindow(), {
                ts_start: new Date(10),
                ts_end: new Date(20),
                names: { b: 1 }
            });
        });
        it('2 data points, different window, bigger span', function () {
            let target = new ewt.EventWindowTracker({ window_len: 10 });
            let res1 = target.addEvent({ name: "a", ts: new Date(5) });
            let res2 = target.addEvent({ name: "b", ts: new Date(26) });
            assert.deepEqual(res1, []);
            assert.deepEqual(res2, [{
                ts_start: new Date(0),
                ts_end: new Date(10),
                names: { a: 1 }
            },
            {
                ts_start: new Date(10),
                ts_end: new Date(20),
                names: []
            }]);
            assert.deepEqual(target.getCurrentWindow(), {
                ts_start: new Date(20),
                ts_end: new Date(30),
                names: { b: 1 }
            });
        });
    });
});
describe('EventDictionary', function () {
    describe('simple', function () {
        it('creatable', function () {
            let target = new ewt.EventDictionary();
        });
        it('empty counts', function () {
            let target = new ewt.EventDictionary();
            assert.deepEqual(target.createSparseVec({}), []);
        });
        it('1 name', function () {
            let target = new ewt.EventDictionary();
            assert.deepEqual(target.createSparseVec({ a: 1 }), [[0, 1]]);
        });
        it('2 names', function () {
            let target = new ewt.EventDictionary();
            assert.deepEqual(target.createSparseVec({ a: 1, b: 4 }), [[0, 1], [1, 4]]);
        });
        it('2 records, 4 distinct names', function () {
            let target = new ewt.EventDictionary();
            assert.deepEqual(target.createSparseVec({ a: 1, b: 4 }), [[0, 1], [1, 4]]);
            assert.deepEqual(target.createSparseVec({ c: 11, d: 14 }), [[2, 11], [3, 14]]);

            assert.equal(target.getName(0), "a");
            assert.equal(target.getName(1), "b");
            assert.equal(target.getName(2), "c");
            assert.equal(target.getName(3), "d");
            assert.equal(target.getDim("a"), 0);
            assert.equal(target.getDim("b"), 1);
            assert.equal(target.getDim("c"), 2);
            assert.equal(target.getDim("d"), 3);
        });
        it('2 records, 3 distinct names', function () {
            let target = new ewt.EventDictionary();
            assert.deepEqual(target.createSparseVec({ a: 1, b: 4 }), [[0, 1], [1, 4]]);
            assert.deepEqual(target.createSparseVec({ a: 11, d: 14 }), [[0, 11], [2, 14]]);

            assert.equal(target.getName(0), "a");
            assert.equal(target.getName(1), "b");
            assert.equal(target.getName(2), "d");
            assert.equal(target.getDim("a"), 0);
            assert.equal(target.getDim("b"), 1);
            assert.strictEqual(target.getDim("c"), null);
            assert.equal(target.getDim("d"), 2);
        });
    });
});
