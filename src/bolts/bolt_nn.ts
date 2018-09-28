import * as q from "./qtopology";
import { NN } from "../nn";

export class NearestNeighborBolt implements q.Bolt {

    private nn: NN;
    private value_name: string;
    private emit_cb: q.BoltEmitCallback;

    constructor() {
        this.nn = null;
        this.emit_cb = null;
    }

    init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.value_name = config.value_name || "distance";
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
        let distance = this.nn.getDistance(data.names, true);
        if (distance >= 0) {
            const rec = { name: this.value_name, value: distance, source: data, ts: data.ts_start };
            this.emit_cb(rec, null, callback);
        } else {
            callback();
        }
    }
}
