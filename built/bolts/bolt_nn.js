"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nn_1 = require("../nn");
const DETECTOR_TYPE = "kNN";
class NearestNeighborBolt {
    constructor() {
        this.nn = null;
        this.emit_cb = null;
        this.source_name = null;
    }
    init(_name, config, _context, callback) {
        this.emit_cb = config.onEmit;
        this.source_name = config.alert_source_name;
        this.nn = new nn_1.NN({
            min_len: config.min_len || 0,
            max_len: config.max_len || -1,
            k: config.k || 1
        });
        callback();
    }
    heartbeat() { }
    shutdown(callback) {
        callback();
    }
    receive(data, _stream_id, callback) {
        if (Object.keys(data.names).length == 0) {
            // do not process empty windows
            return callback();
        }
        let res = this.nn.getDistance(data.names, true);
        if (res.distance >= 0) {
            const alert = {
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
        }
        else {
            callback();
        }
    }
}
exports.NearestNeighborBolt = NearestNeighborBolt;
