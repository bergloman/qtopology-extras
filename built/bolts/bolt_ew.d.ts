import * as q from "./qtopology";
import { IEventWindow } from "../data_objects";
export declare class EventWindowBolt implements q.Bolt {
    private event_window;
    private emit_cb;
    constructor();
    init(_name: string, config: any, _context: any, callback: q.SimpleCallback): void;
    heartbeat(): void;
    shutdown(callback: q.SimpleCallback): void;
    receive(data: any, _stream_id: string, callback: q.SimpleCallback): void;
    sendWindow(window: IEventWindow): Promise<void>;
}
