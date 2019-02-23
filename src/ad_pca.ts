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
    private pca_model: any;
    private cnt_before_active: number;
    private cnt_before_retrain: number;
    private is_active: boolean;
    private retrain_after: number;
    private threshold_cdf: number;
    private ignored_dims_ratio: number;
    private collection: IEventCounts[];
    private dictionary: EventDictionary;

    constructor(cnt_before_active: number, cnt_before_retrain: number) {
        this.cnt_before_active = cnt_before_active;
        this.cnt_before_retrain = cnt_before_retrain;
        this.retrain_after = cnt_before_retrain;
        this.collection = [];
        this.threshold_cdf = 0.99;
        this.ignored_dims_ratio = 0.4;
        this.is_active = (this.cnt_before_active > 0);
        this.tdigest = new tdigest.TDigest();
        this.pca_model = null;
        this.dictionary = null;
    }

    public add(sample: IEventCounts): void {
        // TODO get distance
        const distance = 12;
        this.tdigest.push(distance);
        this.collection.push(sample);

        if (this.cnt_before_active > 1) {
            this.cnt_before_active--;
            return;
        }
        if (this.cnt_before_active == 1) {
            this.cnt_before_active--;
            this.retrain_after = 0;
        }

        if (this.retrain_after == 0) {
            this.retrain_after = this.cnt_before_retrain;

            // re-create dictionary
            this.dictionary = new EventDictionary();
            this.collection.forEach(x => {
                this.dictionary.registerNames(x);
            })

            // prepare all historical data
            const mapped_data = this.collection
                .map(x => new qm.la.SparseVector(this.dictionary.createSparseVec(x)).full());
            const matrix = new qm.la.Matrix(mapped_data).transpose();

            // re-generate PCA model
            this.pca_model = new qm.analytics.PCA();
            this.pca_model.fit(matrix);

            // regenerate t-digest / quantile estimation mechanism
            this.tdigest = new tdigest.TDigest();
            mapped_data.forEach(x => {
                this.tdigest.push(this.getDistance(x));
            });
        } else {
            this.retrain_after--;
        }
    }

    public test(sample: IEventCounts): IADProviderTestResult {
        if (!this.dictionary) {
            return { is_anomaly: false, values: {} };
        }

        const vec = new qm.la.SparseVector(this.dictionary.createSparseVec(sample)).full();
        const distance = this.getDistance(vec);

        const cdf = this.tdigest.p_rank(distance);
        const res: IADProviderTestResult = {
            is_anomaly: this.is_active && cdf > this.threshold_cdf,
            values: {
                cdf,
                threshold_cdf: this.threshold_cdf
            }
        };
        return res;
    }

    private getDistance(dense_vec: any) {
        const vec_transform = this.pca_model.transform(dense_vec);
        for (let i = Math.round(vec_transform.length * (1 - this.ignored_dims_ratio)); i < vec_transform.length; i++) {
            vec_transform[i] = 0;
        }
        const vec2 = this.pca_model.transform(vec_transform);
        const distance = dense_vec.minus(vec2).norm();
        return distance;
    }
}
