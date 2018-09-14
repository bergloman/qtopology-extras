import * as k from "kafka-node";
import * as q from "../../../qtopology";

const HIGH_WATER = 100;
const LOW_WATER = 10;

class DataGenerator {

    private _data: any[];
    private consumer_group: k.ConsumerGroup;
    // private host: string;
    // private topic: string;
    private _high_water_clearing: boolean;
    private _enabled: boolean;

    constructor(host: string, topic: string, groupId: string) {
        this._data = [];

        const options: k.ConsumerGroupOptions = {
            kafkaHost: host,
            ssl: true,
            groupId: groupId || "" + Date.now(),
            sessionTimeout: 15000,
            protocol: ['roundrobin'],
            fromOffset: 'earliest',
            outOfRangeOffset: 'earliest',
            migrateHLC: false,
            migrateRolling: true
        };

        this.consumer_group = new k.ConsumerGroup(options, [topic]);
        this._high_water_clearing = false;
        this._enabled = true;

        this.consumer_group.on("message", (message: k.Message) => {
            this._data.push(JSON.parse("" + message.value));
            if (this._data.length >= HIGH_WATER) {
                this._high_water_clearing = true;
                this.consumer_group.pause();
            }
        });
    }

    enable() {
        if (!this._enabled) {
            if (!this._high_water_clearing) {
                this.consumer_group.resume();
            }
            this._enabled = true;
        }
    }

    disable() {
        if (this._enabled) {
            if (!this._high_water_clearing) {
                this.consumer_group.pause();
            }
            this._enabled = false;
        }
    }

    next() {
        if (!this._enabled) {
            return null;
        }
        if (this._data.length > 0) {
            let msg = this._data[0];
            this._data = this._data.slice(1);
            if (this._data.length <= LOW_WATER) {
                this._high_water_clearing = false;
                this.consumer_group.resume();
            }
            return msg;
        } else {
            return null;
        }
    }

    stop(cb) {
        this.consumer_group.close(true, cb);
    }
}

export class KafkaSpout implements q.Spout {

    private _generator: DataGenerator;

    constructor() {
        this._generator = null;
    }

    init(_name, config, _context, callback) {
        this._generator = new DataGenerator(config.kafka_host, config.topic, config.consumer_group);
        callback();
    }

    heartbeat() { }

    shutdown(callback) {
        this._generator.stop(callback);
    }

    run() {
        this._generator.enable();
    }

    pause() {
        this._generator.disable();
    }

    next(callback) {
        let data = this._generator.next();
        if (data) {
            callback(null, data, null, callback);
        } else {
            callback();
        }
    }
}

