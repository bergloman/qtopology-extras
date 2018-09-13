import * as t from "../ad";
import * as tq from "../ad_quantile";
import * as q from "../../../qtopology";

export class AnomalyDetectorQuantileBolt implements q.Bolt {

    private inner: t.ADEngineScalar;
    private emit_cb: q.BoltEmitCallback;

    constructor() {
        this.inner = null;
        this.emit_cb = null;
    }

    init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        let threshold_low: number | null = config.threshold_low;
        let threshold_high: number | null = config.threshold_high;
        let factory: t.IADProviderScalarFactory = {
            create: function (): t.IADProviderScalar {
                return new tq.QuantileAD2(threshold_low, threshold_high);
            }
        };
        this.inner = new t.ADEngineScalar(factory);
        callback();
    }

    heartbeat() { }

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        let a = this.inner.test(data.name, data.value);
        this.inner.add(data.name, data.value);
        if (a.is_anomaly) {
            a.data = data;
            this.emit_cb(a, null, callback);
        } else {
            callback();
        }
    }
}
