import * as t from "../ad";
import * as tq from "../ad_quantile";
import * as q from "./qtopology";
import { IGdrRecord } from "../data_objects";

const DETECTOR_TYPE_QS = "quantile";
const DETECTOR_TYPE_ZS = "zscore";

/** Base class for scalar anomaly detector */
export abstract class AnomalyDetectorBaseBolt implements q.IBolt {

    private inner: t.ADEngineScalar;
    private emit_cb: q.BoltEmitCallback;
    private transform_helper: q.TransformHelper;
    private detector_postfix: string;
    protected alert_type: string;

    constructor() {
        this.inner = null;
        this.emit_cb = null;
        this.transform_helper = null;
        this.detector_postfix = null;
    }

    init(name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        let factory: t.IADProviderScalarFactory = this.innerInit(config);
        this.inner = new t.ADEngineScalar(factory);
        this.transform_helper = new q.TransformHelper({
            name: config.name_field || "name",
            value: config.value_field || "value",
        });
        callback();
    }

    abstract innerInit(config: any): t.IADProviderScalarFactory;

    heartbeat() { }

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        const new_data = this.transform_helper.transform(data);
        if (new_data.name === undefined || new_data.value === undefined) {
            throw new Error("Input data is not in proper format for AD: " + JSON.stringify(data));
        }
        let a = this.inner.test(new_data.name, new_data.value);
        this.inner.add(new_data.name, new_data.value);
        if (a.is_anomaly) {
            let alert: IGdrRecord = {
                ts: data.ts,
                tags: data.tags,
                values: a.values,
                extra_data: a.extra_data || data.extra_data
            };
            alert.tags["$alert-type"] = this.alert_type;
            alert.tags["$alert-source"] = new_data.name + this.detector_postfix;
            this.emit_cb(alert, null, callback);
        } else {
            callback();
        }
    }
}

/** Anomaly detector using quantiles */
export class AnomalyDetectorQuantileBolt extends AnomalyDetectorBaseBolt {

    constructor() {
        super();
    }

    public innerInit(config: any) {
        let min_count = config.min_count || 100;
        let threshold_low: number = config.threshold_low || -1;
        let threshold_high: number = config.threshold_high || 2;
        this.alert_type = DETECTOR_TYPE_QS;
        let factory: t.IADProviderScalarFactory = {
            create: function(): t.IADProviderScalar {
                return new tq.QuantileAD2(min_count, threshold_low, threshold_high);
            }
        };
        return factory;
    }
}

/** ANomaly detector using ZScore */
export class AnomalyDetectorZScoreBolt extends AnomalyDetectorBaseBolt {

    constructor() {
        super();
    }

    public innerInit(config: any) {
        let min_count = config.min_count || 100;
        let threshold_z_pos: number = config.threshold_z_pos;
        let threshold_z_neg: number = config.threshold_z_neg;
        this.alert_type = DETECTOR_TYPE_ZS;
        let factory: t.IADProviderScalarFactory = {
            create: function(): t.IADProviderScalar {
                return new tq.ZScoreAD(min_count, threshold_z_pos, threshold_z_neg);
            }
        };
        return factory;
    }
}
