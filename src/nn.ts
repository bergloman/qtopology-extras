import * as qm from "qminer";
import { IEventCounts } from "./event_window_tracker";
import { EventDictionary } from "./event_dictionary";

export interface NNParams {
    dictionary?: EventDictionary;
    min_len: number;
    max_len: number;
    k?: number;
}

export class NN {

    private dictionary: EventDictionary;
    private min_len: number;
    private max_len?: number;

    private window: Array<qm.la.SparseVector>;
    private curr_index: number;
    private k: number;

    constructor(params?: NNParams) {
        params = params || { min_len: 0, max_len: -1 };
        this.dictionary = params.dictionary || new EventDictionary();
        this.min_len = params.min_len || -1;
        this.max_len = params.max_len || -1;
        this.k = params.k || 1;
        this.window = [];
        this.curr_index = 0;
    }

    getDistance(w: IEventCounts, auto_add?: boolean): number {
        let svec = this.createSpareVector(w);
        let res = Number.MAX_VALUE;
        if (this.window.length < this.min_len) {
            res = -1;
        } else if (this.window.length == 0) {
            res = 0;
        } else {
            // nearest neighbours, sorted by distance asc
            let svec_closest = [];
            for (let a of this.window) {
                let d = this.distanceInternal(svec, a);
                if (svec_closest.length == this.k) {
                    // early check
                    if (d >= svec_closest[svec_closest.length - 1].d) {
                        continue;
                    }
                }
                svec_closest.push({ d: d, svec: a });
                svec_closest.sort((a, b) => a.d - b.d);
                if (svec_closest.length > this.k) {
                    svec_closest = svec_closest.slice(0, this.k);
                }
            }
            res = svec_closest[svec_closest.length - 1].d;
        }
        if (auto_add) {
            this.addInternal(svec);
        }

        return res;
    }

    private createSpareVector(w: IEventCounts) {
        let vec = this.dictionary.createSparseVec(w);
        let svec = new qm.la.SparseVector(vec);
        svec = svec.normalize();
        return svec;
    }

    add(w: IEventCounts): void {
        let svec = this.createSpareVector(w);
        this.addInternal(svec);
    }

    private addInternal(svec: qm.la.SparseVector) {
        if (this.max_len < 0 || this.window.length < this.max_len) {
            this.window.push(svec);
        } else {
            this.window[this.curr_index] = svec;
            this.curr_index = (this.curr_index + 1) % this.max_len;
        }
    }

    private distanceInternal(a: qm.la.SparseVector, b: qm.la.SparseVector): number {
        return 1 - a.inner(b);
    }
}
