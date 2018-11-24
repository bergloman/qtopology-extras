import * as q from "./qtopology";
import { EventWindowTracker } from "..";
import { IEvent, IEventWindow } from "../data_objects";

export class EventWindowBolt implements q.IBolt {

    private event_window: EventWindowTracker;
    private emit_cb: q.BoltEmitCallback;
    private transform_helper: q.TransformHelper;

    constructor() {
        this.emit_cb = null;
        this.transform_helper = null;
        this.event_window = null;
    }

    init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.event_window = new EventWindowTracker({
            step: config.step || config.window_len || 600000, // default 10 minutes
            window_len: config.window_len || 600000
        });
        this.transform_helper = new q.TransformHelper({
            name: config.name_field || "name",
            ts: config.ts_field || "ts",
        });
        callback();
    }

    heartbeat() { }

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        const event: IEvent = this.transform_helper.transform(data);
        const res = this.event_window.addEvent(event);
        Promise
            .all(res.map(x => this.sendWindow(x)))
            .then(() => { callback(); })
            .catch((err) => { callback(err); });
    }

    async sendWindow(window: IEventWindow): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.emit_cb(window, null, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
