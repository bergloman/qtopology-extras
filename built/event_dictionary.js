"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qm = require("qminer");
/** This class contains dictionary for mapping events to numerics */
class EventDictionary {
    constructor() {
        this.counter = 0;
        this.map = new qm.ht.StrIntMap();
        this.inv_map = new qm.ht.IntStrMap();
    }
    /**
     * This method maps event window summary to sparse vector.
     * @param data Event window summary
     */
    createSparseVec(data) {
        let res = [];
        Object.keys(data)
            .forEach(name => {
            if (!this.map.hasKey(name)) {
                this.map.put(name, this.counter);
                this.inv_map.put(this.counter, name);
                this.counter++;
            }
            let dim = this.map.get(name);
            res.push([dim, data[name]]);
        });
        return res;
    }
    /** Get event name for dimension */
    getName(dim) {
        if (!this.inv_map.hasKey(dim)) {
            return null;
        }
        return this.inv_map.get(dim);
    }
    /**
     * Maps event name to dimension
     * @param name Event name
     */
    getDim(name) {
        if (!this.map.hasKey(name)) {
            return null;
        }
        return this.map.get(name);
    }
}
exports.EventDictionary = EventDictionary;
