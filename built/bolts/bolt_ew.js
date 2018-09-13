"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
class EventWindowBolt {
    constructor() {
        this.emit_cb = null;
    }
    init(_name, config, _context, callback) {
        this.emit_cb = config.onEmit;
        this.event_window = new __1.EventWindowTracker({
            step: config.step || config.window_len || 600000,
            window_len: config.window_len || 600000
        });
        callback();
    }
    heartbeat() { }
    shutdown(callback) {
        callback();
    }
    receive(data, _stream_id, callback) {
        const res = this.event_window.addEvent(data);
        Promise
            .all(res.map(x => this.sendWindow(x)))
            .then(() => { callback(); })
            .catch((err) => { callback(err); });
    }
    sendWindow(window) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.emit_cb(window, null, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
}
exports.EventWindowBolt = EventWindowBolt;
