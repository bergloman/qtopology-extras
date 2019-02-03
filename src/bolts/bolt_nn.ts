import * as q from "./qtopology";
import { NN, NNDense, INNParams } from "../nn";
import { IGdrRecord, IEventCounts } from "../data_objects";
import { EventDictionary } from "../event_dictionary";

const DETECTOR_TYPE = "kNN";

export class NearestNeighborBolt implements q.IBolt {

    private nn: NN | NNDense;
    private emit_cb: q.BoltEmitCallback;
    private source_name: string;
    private ts_tag: string;
    private values_tag: string;

    constructor() {
        this.nn = null;
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
        const nn_params: INNParams = {
            dictionary: context.event_dictionary,
            k: config.k || 1,
            max_len: config.max_len || -1,
            min_len: config.min_len || 0
        };
        if (config.non_normalized) {
            this.nn = new NNDense(nn_params);
        } else {
            this.nn = new NN(nn_params);
        }
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
        const res = this.nn.getDistance(values, true);
        if (res.distance >= 0) {
            const alert: IGdrRecord = {
                extra_data: res,
                tags: {
                    "$alert-source": this.source_name,
                    "$alert-type": DETECTOR_TYPE
                },
                ts: data[this.ts_tag],
                values: {
                    distance: res.distance
                }
            };
            this.emit_cb(alert, null, callback);
        } else {
            callback();
        }
    }
}
