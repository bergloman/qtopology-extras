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

    init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.source_name = config.alert_source_name;
        this.nn = new NN({
            min_len: config.min_len || 0,
            max_len: config.max_len || -1,
            k: config.k || 1
        });
        callback();
    }

    heartbeat() { }

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        if (Object.keys(data.names).length == 0) {
            // do not process empty windows
            return callback();
        }
        let res = this.nn.getDistance(data.names, true);
        if (res.distance >= 0) {
            const alert: IGdrRecord = {
                ts: data.ts_start,
                tags: {
                    "$alert-type": DETECTOR_TYPE,
                    "$alert-source": this.source_name
                },
                values: {
                    distance: res.distance
                },
                extra_data: res
            };
            this.emit_cb(alert, null, callback);
        } else {
            callback();
        }
    }
}
