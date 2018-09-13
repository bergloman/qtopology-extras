import * as q from "../../../qtopology";
import { EventWindowTracker } from "..";
import { IEventWindow } from "../event_window_tracker";

export class EventWindowBolt implements q.Bolt {

    private event_window: EventWindowTracker;
    private emit_cb: q.BoltEmitCallback;

    constructor() {
        this.emit_cb = null;
    }

    init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.emit_cb = config.onEmit;
        this.event_window = new EventWindowTracker({
            step: config.step || config.window_len || 600000, // default 10 minutes
            window_len: config.window_len || 600000
        });
        callback();
    }

    heartbeat() { }

    shutdown(callback: q.SimpleCallback) {
        callback();
    }

    receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        const res = this.event_window.addEvent(data);
        Promise
            .all(res.map(x => this.sendWindow(x)))
            .then(()=>{ callback(); })
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
