import * as qm from "qminer";
import * as tdigest from "tdigest";
import { IGdrValues, IEventCounts } from "./data_objects";
import { IADProviderTestResult } from "./ad";

/**
 * PCA anomaly detector, using qminer implementation.
 */
export class PcaAD {

    private td: any;
    private cnt_before_active: number;
    private cnt_before_retrain: number;
    private is_active: boolean;
    private retrain_after: number;
    private threshold_cdf: number;
    private collection: IEventCounts[];

    constructor(cnt_before_active: number, cnt_before_retrain: number) {
        this.cnt_before_active = cnt_before_active;
        this.cnt_before_retrain = cnt_before_retrain;
        this.retrain_after = cnt_before_retrain;
        this.collection = [];
        this.threshold_cdf = 0.99;
        this.is_active = (this.cnt_before_active > 0);
        this.td = new tdigest.TDigest();
    }

    public add(sample: IEventCounts): void {
        // TODO get distance
        const distance = 12;
        this.td.push(distance);
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
            // TODO retrain
        } else {
            this.retrain_after--;
        }
    }

    public test(sample: IEventCounts): IADProviderTestResult {
        // TODO get distance
        const distance = 12;
        const cdf = this.td.p_rank(distance);
        const res: IADProviderTestResult = {
            is_anomaly: this.is_active && cdf > this.threshold_cdf,
            values: {
                cdf,
                threshold_cdf: this.threshold_cdf
            }
        };
        return res;
    }
}
