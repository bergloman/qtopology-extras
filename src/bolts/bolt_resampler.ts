import * as q from "./qtopology";
import { ITsPointN } from "../data_objects";
import { Resampler } from "../tseries";

export interface IResamplerBoltConfig extends q.IBoltAsyncConfig {
    period: number;
}

export class ResamplerBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private resampler: Resampler;

    constructor() {
        this.emit_cb = null;
        this.resampler = null;
    }

    public async init(_name: string, config: IResamplerBoltConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        this.resampler = new Resampler(config.period);
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: ITsPointN = data as ITsPointN;
        const new_data = this.resampler.add(ddata);
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
