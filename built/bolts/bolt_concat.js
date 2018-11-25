"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ConcatTagsBolt {
    constructor() {
        this.emit_cb = null;
        this.new_tag_name = null;
    }
    init(_name, config, _context, callback) {
        this.emit_cb = config.onEmit;
        this.new_tag_name = config.new_tag_name;
        callback();
    }
    heartbeat() {
        // no-op
    }
    shutdown(callback) {
        callback();
    }
    receive(data, _stream_id, callback) {
        const ddata = data;
        const new_tag_value = Object.keys(ddata.tags)
            .sort()
            .map(x => x + "=" + ddata.tags[x])
            .join(".");
        ddata.tags[this.new_tag_name] = new_tag_value;
        this.emit_cb(ddata, null, callback);
    }
}
exports.ConcatTagsBolt = ConcatTagsBolt;
