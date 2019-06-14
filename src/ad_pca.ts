import * as qm from "qminer";
import * as tdigest from "tdigest";
import { IEventCounts } from "./data_objects";
import { IADProviderTestResult } from "./ad";
import { EventDictionary } from "./event_dictionary";

/** Parameters for PCA anomaly detection */
export interface IPcaADParams {
    cnt_before_active: number;
    cnt_before_retrain: number;
    threshold_cdf: number;
}

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

    constructor(params: IPcaADParams) {
        this.cnt_before_active = params.cnt_before_active;
        this.cnt_before_retrain = params.cnt_before_retrain;
        this.retrain_after = 0;
        this.collection = [];
        this.threshold_cdf = params.threshold_cdf;
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
            this.pca_model = new PcaModel(0.4);
            this.tdigest = this.pca_model.train(this.collection);
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
            if (auto_add) {
                this.add(sample);
            }
            return { is_anomaly: false, values: {} };
        }

        const distance = this.pca_model.getReconstructionError(sample);
        const cdf = this.tdigest.p_rank(distance);
        const res: IADProviderTestResult = {
            is_anomaly: this.isActive() && cdf > this.threshold_cdf,
            values: {
                cdf,
                distance,
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
    public train(collection: IEventCounts[]): tdigest.TDigest {
        // reset dictionary
        this.dictionary = new EventDictionary();
        collection.forEach(x => {
            this.dictionary.registerNames(x);
        });

        // const ts_start = Date.now();
        // prepare all historical data
        const dims = this.dictionary.getEventCount();
        const mapped_data_dense = collection
            .map(x => new qm.la.SparseVector(this.dictionary.createSparseVec(x), dims))
            .map(x => x.full());
        const mapped_data = mapped_data_dense
            .map(x => x.toArray());
        const matrix = new qm.la.Matrix(mapped_data).transpose();

        // re-generate PCA model
        this.pca_model = new qm.analytics.PCA();
        this.pca_model.fit(matrix);

        // regenerate t-digest / quantile estimation mechanism
        const res = new tdigest.TDigest();
        mapped_data_dense.forEach(x => {
            res.push(this.getDistanceInner(x));
        });
        // const ts_end = Date.now();
        // console.log(`PCA model re-training took ${ts_end - ts_start} msec`);
        return res;
    }

    /** Gets reconstruction error for given example */
    public getReconstructionError(sample: IEventCounts): number {
        if (!this.dictionary) {
            return 0;
        }
        const vec = new qm.la.SparseVector(
            this.dictionary.createSparseVec(sample, true),
            this.dictionary.getEventCount()
        ).full();
        return this.getDistanceInner(vec);
    }

    /** Calculates the reconstruction distance for given dense vector */
    private getDistanceInner(dense_vec: qm.la.Vector): number {
        const vec_transform = this.pca_model.transform(dense_vec);
        for (let i = Math.round(vec_transform.length * (1 - this.ignored_dims_ratio)); i < vec_transform.length; i++) {
            vec_transform[i] = 0;
        }
        const vec_reconstructed = this.pca_model.inverseTransform(vec_transform);
        const diff = dense_vec.minus(vec_reconstructed);
        const distance = diff.norm();
        return distance;
    }
}
