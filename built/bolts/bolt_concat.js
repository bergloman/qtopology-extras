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
    heartbeat() { }
    shutdown(callback) {
        callback();
    }
    receive(data, _stream_id, callback) {
        let ddata = data;
        let parts = Object.keys(ddata.tags).map(x => x + "=" + ddata[x]);
        ddata[this.new_tag_name] = parts.concat(".");
        this.emit_cb(ddata, null, callback);
    }
}
exports.ConcatTagsBolt = ConcatTagsBolt;
