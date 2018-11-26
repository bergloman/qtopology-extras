import * as qm from "qminer";
import { EventDictionary } from "./event_dictionary";
import { IEventCounts } from "./data_objects";

export interface INNParams {
    dictionary?: EventDictionary;
    min_len: number;
    max_len: number;
    k?: number;
}

export interface INnResult {
    distance: number;
    k: number;
    input: IEventCounts;
    kNearest: IEventCounts;
}

export class NN {

    private dictionary: EventDictionary;
    private min_len: number;
    private max_len?: number;

    private window: qm.la.SparseVector[];
    private window_n: IEventCounts[];
    private curr_index: number;
    private k: number;

    constructor(params?: INNParams) {
        params = params || { min_len: 0, max_len: -1 };
        this.dictionary = params.dictionary || new EventDictionary();
        this.min_len = params.min_len || -1;
        this.max_len = params.max_len || -1;
        this.k = params.k || 1;
        this.window = [];
        this.window_n = [];
        this.curr_index = 0;
    }

    public getDistance(w: IEventCounts, auto_add?: boolean): INnResult {
        const svec = this.createSpareVector(w);
        let distance = Number.MAX_VALUE;
        let kNearest = {};

        if (this.window.length < this.min_len) {
            distance = -1;
        } else if (this.window.length == 0) {
            distance = 0;
        } else {
            // nearest neighbours, sorted by distance asc
            let svec_closest = [];
            // for (let a of this.window) {
            for (let i = 0; i < this.window.length; i++) {
                const a = this.window[i];
                const d = this.distanceInternal(svec, a);
                if (svec_closest.length == this.k) {
                    // early check
                    if (d >= svec_closest[svec_closest.length - 1].d) {
                        continue;
                    }
                }
                svec_closest.push({ d, svec: a, i });
                svec_closest.sort((x, y) => x.d - y.d);
                if (svec_closest.length > this.k) {
                    svec_closest = svec_closest.slice(0, this.k);
                }
            }
            const last = svec_closest[svec_closest.length - 1];
            distance = last.d;
            kNearest = this.window_n[last.i];
        }
        if (auto_add) {
            this.addInternal(svec, w);
        }

        return {
            distance,
            input: w,
            k: this.k,
            kNearest
        };
    }

    public add(w: IEventCounts): void {
        const svec = this.createSpareVector(w);
        this.addInternal(svec, w);
    }

    private createSpareVector(w: IEventCounts) {
        const vec = this.dictionary.createSparseVec(w);
        let svec = new qm.la.SparseVector(vec);
        svec = svec.normalize();
        return svec;
    }

    private addInternal(svec: qm.la.SparseVector, w: IEventCounts) {
        if (this.max_len < 0 || this.window.length < this.max_len) {
            this.window.push(svec);
            this.window_n.push(w);
        } else {
            this.window[this.curr_index] = svec;
            this.window_n[this.curr_index] = w;
            this.curr_index = (this.curr_index + 1) % this.max_len;
        }
    }

    private distanceInternal(a: qm.la.SparseVector, b: qm.la.SparseVector): number {
        return 1 - a.inner(b);
    }
}
