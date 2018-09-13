"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** This class receives events and calculates their windows */
class EventWindowTracker {
    constructor(options) {
        options = options || {};
        this.window = [];
        this.initialized = false;
        this.start_d = 0;
        this.start_dd = 0;
        this.end_d = 0;
        this.window_len = options.window_len || 10 * 60 * 1000;
        this.step = options.step || this.window_len;
    }
    addEvent(event) {
        let d = event.ts.getTime();
        let dd = Math.floor(d / this.step);
        let res = [];
        // uninitialized window, special case
        if (!this.initialized) {
            this.initialized = true;
            this.start_dd = dd;
            this.start_d = this.step * this.start_dd;
            this.end_d = this.start_d + this.window_len;
            this.addEventInternal(event);
            return res;
        }
        // emit windows until we reach event's timestamp
        while (dd > this.start_dd) {
            res.push(this.getCurrentWindow());
            this.advanceWindowByStep();
        }
        this.addEventInternal(event);
        return res;
    }
    addEventInternal(event) {
        this.window.push({
            name: event.name,
            ts: event.ts,
            ts_d: event.ts.getTime()
        });
    }
    getCurrentWindow() {
        if (!this.initialized) {
            return null;
        }
        let map = {};
        for (let e of this.window) {
            if (!map[e.name]) {
                map[e.name] = 1;
            }
            else {
                map[e.name]++;
            }
        }
        return {
            ts_start: new Date(this.start_d),
            ts_end: new Date(this.end_d),
            names: map
        };
    }
    advanceWindowByStep() {
        this.start_dd++;
        this.start_d = this.step * this.start_dd;
        this.end_d += this.step;
        this.window = this.window
            .filter(x => x.ts_d >= this.start_d);
    }
}
exports.EventWindowTracker = EventWindowTracker;
