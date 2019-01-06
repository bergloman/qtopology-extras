import * as q from "./qtopology";
import { NN, NNDense, INNParams } from "../nn";
import { IGdrRecord } from "../data_objects";
import { EventDictionary } from "../event_dictionary";

const DETECTOR_TYPE = "kNN";

export class NearestNeighborBolt implements q.IBolt {

    private nn: NN | NNDense;
    private emit_cb: q.BoltEmitCallback;
    private source_name: string;

    constructor() {
        this.nn = null;
        this.emit_cb = null;
        this.source_name = null;
    }

    public init(_name: string, config: any, context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.source_name = config.alert_source_name;
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

    public heartbeat() {
        // no-op
    }

    public shutdown(callback: q.SimpleCallback) {
        callback();
    }

    public receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        if (Object.keys(data.names).length == 0) {
            // do not process empty windows
            return callback();
        }
        const res = this.nn.getDistance(data.names, true);
        if (res.distance >= 0) {
            const alert: IGdrRecord = {
                extra_data: res,
                tags: {
                    "$alert-source": this.source_name,
                    "$alert-type": DETECTOR_TYPE
                },
                ts: data.ts_start,
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
