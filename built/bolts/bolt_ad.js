"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("../ad");
const tq = require("../ad_quantile");
const q = require("../../../qtopology");
const DETECTOR_TYPE = "quantile.simple";
class AnomalyDetectorQuantileBolt {
    constructor() {
        this.inner = null;
        this.emit_cb = null;
        this.transform_helper = null;
        this.detector_postfix = null;
    }
    init(name, config, _context, callback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        let min_count = config.min_count || 100;
        let threshold_low = config.threshold_low || -1;
        let threshold_high = config.threshold_high || 2;
        let factory = {
            create: function () {
                return new tq.QuantileAD2(min_count, threshold_low, threshold_high);
            }
        };
        this.inner = new t.ADEngineScalar(factory);
        this.transform_helper = new q.TransformHelper({
            name: config.name_field || "name",
            value: config.value_field || "value",
        });
        callback();
    }
    heartbeat() { }
    shutdown(callback) {
        callback();
    }
    receive(data, _stream_id, callback) {
        const new_data = this.transform_helper.transform(data);
        let a = this.inner.test(new_data.name, new_data.value);
        this.inner.add(new_data.name, new_data.value);
        if (a.is_anomaly) {
            let alert = {
                ts: data.ts,
                type: DETECTOR_TYPE,
                source: data.tags["$name"] + this.detector_postfix,
                tags: data.tags,
                extra_data: a
            };
            this.emit_cb(alert, null, callback);
        }
        else {
            callback();
        }
    }
}
exports.AnomalyDetectorQuantileBolt = AnomalyDetectorQuantileBolt;
