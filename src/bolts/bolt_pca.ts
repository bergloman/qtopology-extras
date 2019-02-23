import * as q from "./qtopology";
import { IGdrRecord, IEventCounts } from "../data_objects";
import { EventDictionary } from "../event_dictionary";
import { IPcaADParams, PcaAD } from "../ad_pca";

const DETECTOR_TYPE = "PCA";

export class PcaBolt implements q.IBolt {

    private pca: PcaAD;
    private emit_cb: q.BoltEmitCallback;
    private source_name: string;
    private ts_tag: string;
    private values_tag: string;

    constructor() {
        this.pca = null;
        this.emit_cb = null;
        this.source_name = null;
        this.ts_tag = null;
        this.values_tag = null;
    }

    public init(_name: string, config: any, context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.source_name = config.alert_source_name;
        this.ts_tag = config.ts_tag || "ts";
        this.values_tag = config.values_tag || "names";
        if (!context.event_dictionary) {
            context.event_dictionary = new EventDictionary();
        }
        const pca_params: IPcaADParams = {
            cnt_before_active: config.cnt_before_active || 100,
            cnt_before_retrain: config.cnt_before_retrain || 100,
            threshold_cdf: config.threshold_cdf || 0.99
        };
        this.pca = new PcaAD(pca_params);
        callback();
    }

    public prepareTransform() {
        // no-op
    }

    public shutdown(callback: q.SimpleCallback) {
        callback();
    }

    public heartbeat(): void {
        // no-op
    }

    public receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        const values: IEventCounts = data[this.values_tag];
        if (Object.keys(values).length == 0) {
            // do not process empty windows
            return callback();
        }
        const res = this.pca.test(values, true);
        if (res.is_anomaly) {
            const alert: IGdrRecord = {
                extra_data: res,
                tags: {
                    "$alert-source": this.source_name,
                    "$alert-type": DETECTOR_TYPE
                },
                ts: data[this.ts_tag],
                values: res.values
            };
            this.emit_cb(alert, null, callback);
        } else {
            callback();
        }
    }
}
