import * as qm from "qminer";
import * as tdigest from "tdigest";
import { IEventCounts } from "./data_objects";
import { IADProviderTestResult } from "./ad";
import { EventDictionary } from "./event_dictionary";

/**
 * PCA anomaly detector, using qminer implementation.
 */
export class PcaAD {

    private tdigest: any;
    private pca_model: PcaModel;
    private cnt_before_active: number;
    private cnt_before_retrain: number;
    private retrain_after: number;
    private threshold_cdf: number;
    private collection: IEventCounts[];

    constructor(cnt_before_active: number, cnt_before_retrain: number) {
        this.cnt_before_active = cnt_before_active;
        this.cnt_before_retrain = cnt_before_retrain;
        this.retrain_after = 0;
        this.collection = [];
        this.threshold_cdf = 0.99;
        this.tdigest = null;
        this.pca_model = null;
    }

    /** Adds sample to internal storage */
    public add(sample: IEventCounts): void {

        this.collection.push(sample);

        if (this.cnt_before_active > 0) {
            this.cnt_before_active--;
            return;
        }

        if (this.retrain_after == 0) {
            this.tdigest = this.pca_model.retrain(this.collection);
            this.retrain_after = this.cnt_before_retrain;
        } else {
            this.retrain_after--;
            const distance = this.pca_model.getReconstructionError(sample);
            this.tdigest.push(distance);
        }
    }

    /** Tests given sample for anomaly */
    public test(sample: IEventCounts, auto_add?: boolean): IADProviderTestResult {
        if (!this.pca_model) {
            return { is_anomaly: false, values: {} };
        }

        const distance = this.pca_model.getReconstructionError(sample);
        const cdf = this.tdigest.p_rank(distance);
        const res: IADProviderTestResult = {
            is_anomaly: this.isActive() && cdf > this.threshold_cdf,
            values: {
                cdf,
                threshold_cdf: this.threshold_cdf
            }
        };
        if (auto_add) {
            this.add(sample);
        }
        return res;
    }

    /** Tests if current object is ready to give predictions */
    public isActive(): boolean {
        return (this.cnt_before_active <= 0);
    }
}

/** PCA model that evaluates reconstruction error */
export class PcaModel {

    private pca_model: any;
    private ignored_dims_ratio: number;
    private dictionary: EventDictionary;

    constructor(ignored_dims_ratio: number) {
        this.ignored_dims_ratio = ignored_dims_ratio;
        this.dictionary = null;
    }

    /** Retrains model given new data. It overrides existing model. */
    public retrain(collection: IEventCounts[]): tdigest.TDigest {
        this.dictionary = new EventDictionary();
        collection.forEach(x => {
            this.dictionary.registerNames(x);
        });
        // prepare all historical data
        const mapped_data = collection
            .map(x => new qm.la.SparseVector(this.dictionary.createSparseVec(x)).full());
        const matrix = new qm.la.Matrix(mapped_data).transpose();
        // re-generate PCA model
        this.pca_model = new qm.analytics.PCA();
        this.pca_model.fit(matrix);
        // regenerate t-digest / quantile estimation mechanism
        const res = new tdigest.TDigest();
        mapped_data.forEach(x => {
            res.push(this.getReconstructionError(x));
        });
        return res;
    }

    /** Gets reconstruction error for given example */
    public getReconstructionError(sample: IEventCounts): number {
        const vec = new qm.la.SparseVector(this.dictionary.createSparseVec(sample)).full();
        return this.getDistanceInner(vec);
    }

    /** Calculate the reconstruction distance for given dense vector */
    private getDistanceInner(dense_vec: qm.la.Vector): number {
        const vec_transform = this.pca_model.transform(dense_vec);
        for (let i = Math.round(vec_transform.length * (1 - this.ignored_dims_ratio)); i < vec_transform.length; i++) {
            vec_transform[i] = 0;
        }
        const vec2 = this.pca_model.transform(vec_transform);
        const distance = dense_vec.minus(vec2).norm();
        return distance;
    }
}
