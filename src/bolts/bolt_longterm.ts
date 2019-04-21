import * as q from "./qtopology";
import { IGdrRecord } from "../data_objects";
import { LongtermChangeDetection } from "../longterm_change_ad";

export class LongtermChangeBolt implements q.IBolt {

    private emit_cb: q.BoltEmitCallback;
    private transform_helper: q.TransformHelper;
    private detectors: Map<string, LongtermChangeDetection>;
    private short: number;
    private long: number;
    private detector_postfix: string;

    constructor() {
        this.emit_cb = null;
        this.transform_helper = null;
        this.detectors = new Map<string, LongtermChangeDetection>();
        this.short = 0;
        this.long = 0;
        this.detector_postfix = null;
    }

    public init(name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.detector_postfix = "." + name;
        this.short = config.short_term || 24 * 60 * 60 * 1000;
        this.long = config.long_term || this.short;

        this.transform_helper = new q.TransformHelper({
            name: config.name_field || "name",
            value: config.value_field || "value"
        });
        callback();
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
        if (!this.detectors.has(new_data.name)) {
            this.detectors.set(new_data.name, new LongtermChangeDetection(this.short, this.long));
        }
        const detector = this.detectors.get(new_data.name);
        detector.add({ ts: data.ts, val: new_data.value });
        if (detector.isAnomaly()) {
            const alert: IGdrRecord = {
                extra_data: data.extra_data,
                tags: data.tags || {},
                ts: data.ts,
                values: detector.getLastAnomalyResults()
            };
            alert.tags["$alert-type"] = "longterm-change";
            alert.tags["$alert-source"] = new_data.name + this.detector_postfix;
            this.emit_cb(alert, null, callback);
        } else {
            callback();
        }
    }
}
