"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qm = require("qminer");
const event_dictionary_1 = require("./event_dictionary");
class NN {
    constructor(params) {
        params = params || { min_len: 0, max_len: -1 };
        this.dictionary = params.dictionary || new event_dictionary_1.EventDictionary();
        this.min_len = params.min_len || -1;
        this.max_len = params.max_len || -1;
        this.k = params.k || 1;
        this.window = [];
        this.window_n = [];
        this.curr_index = 0;
    }
    getDistance(w, auto_add) {
        let svec = this.createSpareVector(w);
        let distance = Number.MAX_VALUE;
        let kNearest = {};
        if (this.window.length < this.min_len) {
            distance = -1;
        }
        else if (this.window.length == 0) {
            distance = 0;
        }
        else {
            // nearest neighbours, sorted by distance asc
            let svec_closest = [];
            //for (let a of this.window) {
            for (let i = 0; i < this.window.length; i++) {
                let a = this.window[i];
                let d = this.distanceInternal(svec, a);
                if (svec_closest.length == this.k) {
                    // early check
                    if (d >= svec_closest[svec_closest.length - 1].d) {
                        continue;
                    }
                }
                svec_closest.push({ d: d, svec: a, i: i });
                svec_closest.sort((a, b) => a.d - b.d);
                if (svec_closest.length > this.k) {
                    svec_closest = svec_closest.slice(0, this.k);
                }
            }
            let last = svec_closest[svec_closest.length - 1];
            distance = last.d;
            kNearest = this.window_n[last.i];
        }
        if (auto_add) {
            this.addInternal(svec, w);
        }
        return {
            distance: distance,
            k: this.k,
            input: w,
            kNearest: kNearest
        };
    }
    createSpareVector(w) {
        let vec = this.dictionary.createSparseVec(w);
        let svec = new qm.la.SparseVector(vec);
        svec = svec.normalize();
        return svec;
    }
    add(w) {
        let svec = this.createSpareVector(w);
        this.addInternal(svec, w);
    }
    addInternal(svec, w) {
        if (this.max_len < 0 || this.window.length < this.max_len) {
            this.window.push(svec);
            this.window_n.push(w);
        }
        else {
            this.window[this.curr_index] = svec;
            this.window_n[this.curr_index] = w;
            this.curr_index = (this.curr_index + 1) % this.max_len;
        }
    }
    distanceInternal(a, b) {
        return 1 - a.inner(b);
    }
}
exports.NN = NN;
