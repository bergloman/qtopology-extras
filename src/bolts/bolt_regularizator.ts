import * as q from "./qtopology";
import { ITsPointN } from "../data_objects";
import { Regularizator, Normalizator } from "../tseries";

export interface IRegularizatorBoltConfig extends q.IBoltAsyncConfig {
    delay: number;
    reemit_delay: boolean;
}

export class RegularizatorBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private inner: Regularizator;

    constructor() {
        this.emit_cb = null;
        this.inner = null;
    }

    public async init(_name: string, config: IRegularizatorBoltConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        this.inner = new Regularizator(config.delay, config.reemit_delay);
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: ITsPointN = data as ITsPointN;
        const new_data = this.inner.add(ddata);
        for (const d of new_data) {
            await this.emit_cb(d, null);
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
    private inner: Normalizator;

    constructor() {
        this.emit_cb = null;
        this.inner = null;
    }

    public async init(_name: string, config: IRegularizatorBoltConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        this.inner = new Normalizator(config.delay, config.reemit_delay);
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: ITsPointN = data as ITsPointN;
        const new_data = this.inner.add(ddata);
        for (const d of new_data) {
            await this.emit_cb(d, null);
        }
    }

    public heartbeat(): void {
        // empty
    }

    public async shutdown(): Promise<void> {
        // empty
    }
}
