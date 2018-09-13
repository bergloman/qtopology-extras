import * as t from "../ad";
import * as tq from "../ad_quantile";
import * as q from "../../../qtopology";

const DETECTOR_TYPE = "quantile.simple";

export class AnomalyDetectorQuantileBolt implements q.Bolt {

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

    init(name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        let threshold_low: number | null = config.threshold_low;
        let threshold_high: number | null = config.threshold_high;
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
        } else {
            callback();
        }
    }
}
