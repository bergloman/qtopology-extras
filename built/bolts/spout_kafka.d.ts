import * as q from "../../../qtopology";
export declare class KafkaSpout implements q.Spout {
    private _generator;
    constructor();
    init(_name: any, config: any, _context: any, callback: any): void;
    heartbeat(): void;
    shutdown(callback: any): void;
    run(): void;
    pause(): void;
    next(callback: any): void;
}
