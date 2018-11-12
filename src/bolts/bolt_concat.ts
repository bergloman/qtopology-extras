import * as q from "./qtopology";
import { IGdrRecord } from "../data_objects";

export class ConcatTagsBolt implements q.Bolt {

    private emit_cb: q.BoltEmitCallback;
    private new_tag_name: string;

    constructor() {
        this.emit_cb = null;
        this.new_tag_name = null;
    }

    init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.new_tag_name = config.new_tag_name;
        callback();
    }

    heartbeat() { }

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        let ddata: IGdrRecord = data as IGdrRecord;
        let new_tag_value =
            Object.keys(ddata.tags)
                .sort()
                .map(x => x + "=" + ddata.tags[x])
                .join(".");
        ddata.tags[this.new_tag_name] = new_tag_value;
        this.emit_cb(ddata, null, callback);
    }
}
