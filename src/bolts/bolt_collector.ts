import * as q from "./qtopology";
import { IMetricN, IMetric } from "../data_objects";

export class MetricCollectorBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private curr_ts: Date;
    private curr_obj: any;

    constructor() {
        this.emit_cb = null;
        this.curr_ts = null;
        this.curr_obj = null;
    }

    public async init(_name: string, config: q.IBoltAsyncConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: IMetric = data as IMetric;
        if (this.curr_ts != ddata.ts) {
            await this.emitCurrent();
            this.curr_obj = {};
            this.curr_ts = ddata.ts;
        }
        this.curr_obj[ddata.name] = ddata.val;
    }

    public heartbeat(): void {
        // empty
    }

    public async shutdown(): Promise<void> {
        await this.emitCurrent();
    }

    private async emitCurrent() {
        if (this.curr_obj) {
            const x = this.curr_obj;
            this.curr_obj = null;
            x.ts = this.curr_ts;
            await this.emit_cb(x, null);
        }
    }
}

export class MetricNCollectorBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private curr_ts: number;
    private curr_obj: any;

    constructor() {
        this.emit_cb = null;
        this.curr_ts = -1;
        this.curr_obj = null;
    }

    public async init(_name: string, config: q.IBoltAsyncConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: IMetricN = data as IMetricN;
        if (this.curr_ts != ddata.ts) {
            await this.emitCurrent();
            this.curr_obj = {};
            this.curr_ts = ddata.ts;
        }
        this.curr_obj[ddata.name] = ddata.val;
    }

    public heartbeat(): void {
        // empty
    }

    public async shutdown(): Promise<void> {
        await this.emitCurrent();
    }

    private async emitCurrent() {
        if (this.curr_obj) {
            const x = this.curr_obj;
            this.curr_obj = null;
            await this.emit_cb(x, null);
        }
    }
}
