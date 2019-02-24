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

/** kNN algorithm that operates on sparse data (BOI) */
export class NNSparse {

    private dictionary: EventDictionary;
    private min_len: number;
    private max_len?: number;

    private window_sparse: qm.la.SparseVector[];
    private window_n: IEventCounts[];
    private curr_index: number;
    private k: number;

    constructor(params?: INNParams) {
        params = params || { min_len: 0, max_len: -1 };
        this.dictionary = params.dictionary || new EventDictionary();
        this.min_len = params.min_len || -1;
        this.max_len = params.max_len || -1;
        this.k = params.k || 1;
        this.window_sparse = [];
        this.window_n = [];
        this.curr_index = 0;
    }

    public getDistance(w: IEventCounts, auto_add?: boolean): INnResult {
        const svec = this.createSpareVector(w);
        let distance = Number.MAX_VALUE;
        let kNearest = {};

        if (this.window_sparse.length < this.min_len) {
            distance = -1;
        } else if (this.window_sparse.length == 0) {
            distance = 0;
        } else {
            // nearest neighbours, sorted by distance asc
            let svec_closest = [];
            // for (let a of this.window) {
            for (let i = 0; i < this.window_sparse.length; i++) {
                const a = this.window_sparse[i];
                const d = this.distanceInternalNormalized(svec, a);
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
            this.addInternalSparse(svec, w);
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
        this.addInternalSparse(svec, w);
    }

    private createSpareVector(w: IEventCounts) {
        const vec = this.dictionary.createSparseVec(w);
        let svec = new qm.la.SparseVector(vec);
        svec = svec.normalize();
        return svec;
    }

    private addInternalSparse(svec: qm.la.SparseVector, w: IEventCounts) {
        if (this.max_len < 0 || this.window_sparse.length < this.max_len) {
            this.window_sparse.push(svec);
            this.window_n.push(w);
        } else {
            this.window_sparse[this.curr_index] = svec;
            this.window_n[this.curr_index] = w;
            this.curr_index = (this.curr_index + 1) % this.max_len;
        }
    }

    private distanceInternalNormalized(a: qm.la.SparseVector, b: qm.la.SparseVector): number {
        return 1 - a.inner(b);
    }
}

/** kNN algorithm that operates on dense data (BOI) */
export class NNDense {

    private dictionary: EventDictionary;
    private min_len: number;
    private max_len?: number;

    private window_dense: qm.la.Vector[];
    private window_n: IEventCounts[];
    private curr_index: number;
    private k: number;

    constructor(params?: INNParams) {
        params = params || { min_len: 0, max_len: -1 };
        this.dictionary = params.dictionary || new EventDictionary();
        this.min_len = params.min_len || -1;
        this.max_len = params.max_len || -1;
        this.k = params.k || 1;
        this.window_dense = [];
        this.window_n = [];
        this.curr_index = 0;
    }

    public getDistance(w: IEventCounts, auto_add?: boolean): INnResult {
        const svec = this.createDenseVector(w);
        let distance = Number.MAX_VALUE;
        let kNearest = {};

        if (this.window_dense.length < this.min_len) {
            distance = -1;
        } else if (this.window_dense.length == 0) {
            distance = 0;
        } else {
            // nearest neighbours, sorted by distance asc
            let svec_closest = [];
            for (let i = 0; i < this.window_dense.length; i++) {
                const a = this.window_dense[i];
                const d = this.distanceInternalNonNormalized(svec, a);
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
            this.addInternalDense(svec, w);
        }

        return {
            distance,
            input: w,
            k: this.k,
            kNearest
        };
    }

    public add(w: IEventCounts): void {
        const vec = this.createDenseVector(w);
        this.addInternalDense(vec, w);
    }

    private createDenseVector(w: IEventCounts) {
        const vec = this.dictionary.createSparseVec(w);
        const svec = new qm.la.SparseVector(vec);
        const dense_vec = svec.full();
        return dense_vec;
    }

    private addInternalDense(svec: qm.la.Vector, w: IEventCounts) {
        if (this.max_len < 0 || this.window_dense.length < this.max_len) {
            this.window_dense.push(svec);
            this.window_n.push(w);
        } else {
            this.window_dense[this.curr_index] = svec;
            this.window_n[this.curr_index] = w;
            this.curr_index = (this.curr_index + 1) % this.max_len;
        }
    }

    private distanceInternalNonNormalized(a: qm.la.Vector, b: qm.la.Vector): number {
        while (a.length < this.dictionary.getEventCount()) {
            a.push(0);
        }
        while (b.length < this.dictionary.getEventCount()) {
            b.push(0);
        }
        return a.minus(b).norm();
    }
}
