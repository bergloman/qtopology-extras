import * as t from "../ad";
import * as tq from "../ad_quantile";
import * as q from "./qtopology";
import { IGdrRecord } from "../data_objects";

const DETECTOR_TYPE_QS = "quantile";
const DETECTOR_TYPE_ZS = "zscore";

/** Base class for scalar anomaly detector */
export abstract class AnomalyDetectorBaseBolt implements q.IBolt {
    protected alert_type: string;

    private inner: t.ADEngineScalar;
    private emit_cb: q.BoltEmitCallback;
    private transform_helper: q.TransformHelper;
    private detector_postfix: string;

    constructor() {
        this.inner = null;
        this.emit_cb = null;
        this.transform_helper = null;
        this.detector_postfix = null;
    }

    public init(name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        const factory: t.IADProviderScalarFactory = this.innerInit(config);
        this.inner = new t.ADEngineScalar(factory);
        this.transform_helper = new q.TransformHelper({
            name: config.name_field || "name",
            value: config.value_field || "value"
        });
        callback();
    }

    public abstract innerInit(config: any): t.IADProviderScalarFactory;

    public prepareTransform() {
        // no-op
    }

    public shutdown(callback: q.SimpleCallback) {
        callback();
    }

    public heartbeat(): void {
        // no-op
    }

    public receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        const new_data = this.transform_helper.transform(data);
        if (new_data.name === undefined || new_data.value === undefined) {
            throw new Error("Input data is not in proper format for AD: " + JSON.stringify(data));
        }
        const a = this.inner.test(new_data.name, new_data.value);
        this.inner.add(new_data.name, new_data.value);
        if (a.is_anomaly) {
            const alert: IGdrRecord = {
                extra_data: a.extra_data || data.extra_data,
                tags: data.tags,
                ts: data.ts,
                values: a.values
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
        const min_count = config.min_count || 100;
        const threshold_low: number = config.threshold_low || -1;
        const threshold_high: number = config.threshold_high || 2;
        this.alert_type = DETECTOR_TYPE_QS;
        const factory: t.IADProviderScalarFactory = {
            create(): t.IADProviderScalar {
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
        const min_count = config.min_count || 100;
        const threshold_z_pos: number = config.threshold_z_pos;
        const threshold_z_neg: number = config.threshold_z_neg;
        this.alert_type = DETECTOR_TYPE_ZS;
        const factory: t.IADProviderScalarFactory = {
            create(): t.IADProviderScalar {
                return new tq.ZScoreAD(min_count, threshold_z_pos, threshold_z_neg);
            }
        };
        return factory;
    }
}
