import * as k from "kafka-node";
import * as q from "./qtopology";

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
            fromOffset: "earliest",
            groupId: groupId || "" + Date.now(),
            kafkaHost: host || "localhost:9092",
            migrateHLC: false,
            migrateRolling: true,
            outOfRangeOffset: "earliest",
            protocol: ["roundrobin"],
            sessionTimeout: 15000,
            ssl: true
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

    public enable() {
        if (!this._enabled) {
            if (!this._high_water_clearing) {
                this.consumer_group.resume();
            }
            this._enabled = true;
        }
    }

    public disable() {
        if (this._enabled) {
            if (!this._high_water_clearing) {
                this.consumer_group.pause();
            }
            this._enabled = false;
        }
    }

    public next() {
        if (!this._enabled) {
            return null;
        }
        if (this._data.length > 0) {
            const msg = this._data[0];
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

    public stop(cb) {
        this.consumer_group.close(true, cb);
    }
}

export class KafkaSpout implements q.ISpout {

    private _generator: DataGenerator;

    constructor() {
        this._generator = null;
    }

    public init(_name, config, _context, callback) {
        this._generator = new DataGenerator(config.kafka_host, config.topic, config.consumer_group);
        callback();
    }

    public heartbeat() {
        // no-op
    }

    public shutdown(callback) {
        this._generator.stop(callback);
    }

    public run() {
        this._generator.enable();
    }

    public pause() {
        this._generator.disable();
    }

    public next(callback) {
        const data = this._generator.next();
        if (data) {
            callback(null, data, null, callback);
        } else {
            callback();
        }
    }
}

/**
 * Kafka producer class.
 */
export class KafkaProducer {

    private _ready: boolean;
    private _topic: string;
    private _producer: k.HighLevelProducer;

    constructor(host: string, topic: string, callback: q.SimpleCallback) {
        const options = {
            kafkaHost: host
        };
        this._topic = topic;
        this._ready = false;
        const client = new k.KafkaClient(options);
        this._producer = new k.HighLevelProducer(client);
        this._producer.on("ready", () => {
            this._producer.createTopics([topic], false, (error, _data) => {
                if (error) {
                    return callback(error);
                }
                this._ready = true;
                callback();
            });
        });
    }

    /**
     * Sends the message to the appropriate topic.
     */
    public send(msg: any, callback: q.SimpleCallback) {
        const self = this;
        if (self._ready) {
            const messages = JSON.stringify(msg);
            const payload = [{ topic: this._topic, messages }];
            self._producer.send(payload, callback);
        } else {
            callback(new Error("Kafka producer is not ready yet"));
        }
    }

}

export class KafkaBolt implements q.IBolt {

    private producer: KafkaProducer;

    constructor() {
        this.producer = null;
    }

    public init(_name: string, config: any, _context: any, callback: q.SimpleCallback) {
        this.producer = new KafkaProducer(config.host, config.topic, callback);
    }

    public prepareTransform() {
        // no-op
    }

    public shutdown(callback: q.SimpleCallback) {
        callback();
    }

    public receive(data: any, _stream_id: string, callback: q.SimpleCallback) {
        this.producer.send(data, callback);
    }

    public heartbeat(): void {
        // no-op
    }
}
