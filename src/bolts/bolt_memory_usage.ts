import * as q from "./qtopology";

export class MemoryUsageBolt implements q.IBoltAsync {

    private start_ts: number;
    private last_ts: number;

    constructor() {
        this.start_ts = Date.now();
        this.last_ts = Date.now();
    }

    public async init(_name: string, _config: any, _context: any): Promise<void> {
        // do nothing
    }

    public async receive(_data: any, _stream_id: string): Promise<void> {
        // do nothing
    }

    public heartbeat(): void {
        const now = Date.now();
        if (now - this.last_ts > 10 * 1000) {
            this.printMemoryUsage();
            this.last_ts = now;
        }
    }

    public async shutdown(): Promise<void> {
        this.printMemoryUsage();
    }

    private printMemoryUsage(): void {
        const mem = process.memoryUsage();
        const now = Date.now();
        const diff_sec = (now - this.start_ts) / 1000;
        console.log(`Time=${diff_sec}s Memory=${mem.heapTotal}`);
    }
}
