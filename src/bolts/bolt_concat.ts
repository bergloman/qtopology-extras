import * as q from "./qtopology";
import { IGdrRecord } from "../data_objects";

export interface IConcatTagsBoltConfig extends q.IBoltAsyncConfig {
    new_tag_name: string;
}

export class ConcatTagsBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private new_tag_name: string;

    constructor() {
        this.emit_cb = null;
        this.new_tag_name = null;
    }

    public async init(_name: string, config: IConcatTagsBoltConfig, _context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        this.new_tag_name = config.new_tag_name;
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata: IGdrRecord = data as IGdrRecord;
        const new_tag_value =
            Object.keys(ddata.tags)
                .sort()
                .map(x => x + "=" + ddata.tags[x])
                .join(".");
        ddata.tags[this.new_tag_name] = new_tag_value;
        await this.emit_cb(ddata, null);
    }

    public heartbeat(): void {
        // empty
    }

    public async shutdown(): Promise<void> {
        // empty
    }
}
