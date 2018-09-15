import * as t from "../ad";
import * as tq from "../ad_quantile";
import * as q from "../../../qtopology";

const DETECTOR_TYPE = "quantile.simple";

export class AnomalyDetectorQuantileBolt implements q.Bolt {

    private count_before_active: number;
    private inner: t.ADEngineScalar;
    private emit_cb: q.BoltEmitCallback;
    private transform_helper: q.TransformHelper;
    private detector_postfix: string;

    constructor() {
        this.count_before_active = 100;
        this.inner = null;
        this.emit_cb = null;
        this.transform_helper = null;
        this.detector_postfix = null;
    }

    init(name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        this.count_before_active = config.min_count || 100;
        let threshold_low: number = config.threshold_low || -1;
        let threshold_high: number = config.threshold_high || 2;
        let factory: t.IADProviderScalarFactory = {
            create: function (): t.IADProviderScalar {
                return new tq.QuantileAD2(threshold_low, threshold_high);
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

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        this.count_before_active--;
        const new_data = this.transform_helper.transform(data);
        let a = this.inner.test(new_data.name, new_data.value);
        this.inner.add(new_data.name, new_data.value);
        if (this.count_before_active < 0 && a.is_anomaly) {
            this.count_before_active = -1;
            let alert = {
                ts: data.ts,
                type: DETECTOR_TYPE,
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
