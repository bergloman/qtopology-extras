import * as q from "./qtopology";
import { IMetricN } from "../data_objects";
import { Regularizator, Normalizator } from "../tseries";

export interface IRegularizatorBoltConfig extends q.IBoltAsyncConfig {
    delay: number;
    reemit_delay: boolean;
}

export class RegularizatorBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private delay: number;
    private map: Map<string, Regularizator>;

    constructor() {
        this.emit_cb = null;
        this.delay = 100;
        this.map = new Map<string, Regularizator>();
    }

    public async init(_name: string, config: IRegularizatorBoltConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        this.delay = config.delay || 100;
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: IMetricN = data as IMetricN;
        if (!this.map.has(ddata.name)) {
            this.map.set(ddata.name, new Regularizator(this.delay || 100, false));
        }
        const new_data = this.map.get(ddata.name).add(ddata);
        for (const d of new_data) {
            const x = Object.assign({}, data);
            x.ts = d.ts;
            x.val = d.val;
            await this.emit_cb(x, null);
        }
    }

    public heartbeat(): void {
        // empty
    }

    public async shutdown(): Promise<void> {
        // empty
    }
}

export class NormalizatorBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private delay: number;
    private map: Map<string, Normalizator>;

    constructor() {
        this.emit_cb = null;
        this.delay = 100;
        this.map = new Map<string, Normalizator>();
    }

    public async init(_name: string, config: IRegularizatorBoltConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        this.delay = config.delay || 100;
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: IMetricN = data as IMetricN;
        if (!this.map.has(ddata.name)) {
            this.map.set(ddata.name, new Normalizator(this.delay || 100, false));
        }
        const new_data = this.map.get(ddata.name).add(ddata);
        for (const d of new_data) {
            const x = Object.assign({}, data);
            x.ts = d.ts;
            x.val = d.val;
            await this.emit_cb(x, null);
        }
    }

    public heartbeat(): void {
        // empty
    }

    public async shutdown(): Promise<void> {
        // empty
    }
}
