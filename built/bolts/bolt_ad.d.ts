import * as q from "../../../qtopology";
export declare class AnomalyDetectorQuantileBolt implements q.Bolt {
    private inner;
    private emit_cb;
    private transform_helper;
    private detector_postfix;
    constructor();
    init(name: string, config: any, _context: any, callback: q.SimpleCallback): void;
    heartbeat(): void;
    shutdown(callback: q.SimpleCallback): void;
    receive(data: any, _stream_id: string, callback: q.SimpleCallback): void;
}
