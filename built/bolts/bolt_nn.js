"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nn_1 = require("../nn");
class NearestNeighborBolt {
    constructor() {
        this.nn = null;
        this.emit_cb = null;
    }
    init(_name, config, _context, callback) {
        this.emit_cb = config.onEmit;
        this.value_name = config.value_name || "distance";
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
        let distance = this.nn.getDistance(data.names, true);
        if (distance >= 0) {
            const rec = { name: this.value_name, value: distance, source: data };
            this.emit_cb(rec, null, callback);
        }
        else {
            callback();
        }
    }
}
exports.NearestNeighborBolt = NearestNeighborBolt;
