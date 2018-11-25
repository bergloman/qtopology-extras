import * as q from "./qtopology";
import { NN } from "../nn";
import { IGdrRecord } from "../data_objects";

const DETECTOR_TYPE = "kNN";

export class NearestNeighborBolt implements q.IBolt {

    private nn: NN;
    private emit_cb: q.BoltEmitCallback;
    private source_name: string;

    constructor() {
        this.nn = null;
        this.emit_cb = null;
        this.source_name = null;
    }

    public init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.source_name = config.alert_source_name;
        this.nn = new NN({
            k: config.k || 1,
            max_len: config.max_len || -1,
            min_len: config.min_len || 0
        });
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
