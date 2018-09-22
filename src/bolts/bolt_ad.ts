import * as t from "../ad";
import * as tq from "../ad_quantile";
import * as q from "../../../qtopology";

const DETECTOR_TYPE_QS = "quantile.simple";
const DETECTOR_TYPE_ZS = "zscore";

/** Base class for scalar anomaly detector */
export abstract class AnomalyDetectorBaseBolt implements q.Bolt {

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
        let a = this.inner.test(new_data.name, new_data.value);
        this.inner.add(new_data.name, new_data.value);
        if (a.is_anomaly) {
            let alert = {
                ts: data.ts,
                type: this.alert_type,
                source: data.tags["$name"] + this.detector_postfix,
                tags: data.tags,
                extra_data: a
            };
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
            create: function (): t.IADProviderScalar {
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
        let threshold_z: number = config.threshold_z || 3;
        this.alert_type = DETECTOR_TYPE_ZS;
        let factory: t.IADProviderScalarFactory = {
            create: function (): t.IADProviderScalar {
                return new tq.ZScoreAD(min_count, threshold_z);
            }
        };
        return factory;
    }
}
