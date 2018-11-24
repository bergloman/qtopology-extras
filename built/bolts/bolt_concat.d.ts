import * as q from "./qtopology";
export declare class ConcatTagsBolt implements q.IBolt {
    private emit_cb;
    private new_tag_name;
    constructor();
    init(_name: string, config: any, _context: any, callback: q.SimpleCallback): void;
    heartbeat(): void;
    shutdown(callback: q.SimpleCallback): void;
    receive(data: any, _stream_id: string, callback: q.SimpleCallback): void;
}
