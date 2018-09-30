import * as q from "./qtopology";
export declare class NearestNeighborBolt implements q.Bolt {
    private nn;
    private emit_cb;
    constructor();
    init(_name: string, config: any, _context: any, callback: q.SimpleCallback): void;
    heartbeat(): void;
    shutdown(callback: q.SimpleCallback): void;
    receive(data: any, _stream_id: string, callback: q.SimpleCallback): void;
}
