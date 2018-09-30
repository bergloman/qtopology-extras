"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t = require("../ad");
const tq = require("../ad_quantile");
const q = require("./qtopology");
const DETECTOR_TYPE_QS = "quantile";
const DETECTOR_TYPE_ZS = "zscore";
/** Base class for scalar anomaly detector */
class AnomalyDetectorBaseBolt {
    constructor() {
        this.inner = null;
        this.emit_cb = null;
        this.transform_helper = null;
        this.detector_postfix = null;
    }
    init(name, config, _context, callback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        let factory = this.innerInit(config);
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
                tags: data.tags,
                values: a.values,
                extra_data: a.extra_data
            };
            alert.tags["$alert-type"] = this.alert_type;
            alert.tags["$alert-source"] = new_data.name + this.detector_postfix;
            this.emit_cb(alert, null, callback);
        }
        else {
            callback();
        }
    }
}
exports.AnomalyDetectorBaseBolt = AnomalyDetectorBaseBolt;
/** Anomaly detector using quantiles */
class AnomalyDetectorQuantileBolt extends AnomalyDetectorBaseBolt {
    constructor() {
        super();
    }
    innerInit(config) {
        let min_count = config.min_count || 100;
        let threshold_low = config.threshold_low || -1;
        let threshold_high = config.threshold_high || 2;
        this.alert_type = DETECTOR_TYPE_QS;
        let factory = {
            create: function () {
                return new tq.QuantileAD2(min_count, threshold_low, threshold_high);
            }
        };
        return factory;
    }
}
exports.AnomalyDetectorQuantileBolt = AnomalyDetectorQuantileBolt;
/** ANomaly detector using ZScore */
class AnomalyDetectorZScoreBolt extends AnomalyDetectorBaseBolt {
    constructor() {
        super();
    }
    innerInit(config) {
        let min_count = config.min_count || 100;
        let threshold_z_pos = config.threshold_z_pos;
        let threshold_z_neg = config.threshold_z_neg;
        this.alert_type = DETECTOR_TYPE_ZS;
        let factory = {
            create: function () {
                return new tq.ZScoreAD(min_count, threshold_z_pos, threshold_z_neg);
            }
        };
        return factory;
    }
}
exports.AnomalyDetectorZScoreBolt = AnomalyDetectorZScoreBolt;
