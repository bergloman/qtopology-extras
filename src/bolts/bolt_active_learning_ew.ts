import * as q from "./qtopology";
import { IEventWindow, IEventWindowSupervisor } from "../data_objects";
import { ADProviderEventWindow } from "../ad_event_window";
import { SparseVecClassifierSVC } from "../classifiers";
import { EventDictionary } from "../event_dictionary";

export interface IActiveLearningEWBoltConfig extends q.IBoltAsyncConfig {
    new_tag_name: string;
    top_per_day: number;
    max_n2p_ratio?: number;
}

export class ActiveLearningEWBolt implements q.IBoltAsync {

    private emit_cb: q.BoltAsyncEmitCallback;
    private ad_ex: ADProviderEventWindow;

    constructor() {
        this.emit_cb = null;
        this.ad_ex = null;
    }

    public async init(_name: string, config: IActiveLearningEWBoltConfig, context: any): Promise<void> {
        this.emit_cb = config.onEmit;
        if (!context.event_dictionary) {
            context.event_dictionary = new EventDictionary();
        }
        const supervizor: IEventWindowSupervisor = {
            isAnomaly: (arg: IEventWindow): boolean => {
                return context.isDisruption(arg.ts_start.getTime(), arg.ts_end.getTime());
            }
        };
        this.ad_ex = new ADProviderEventWindow({
            alert_source_name: "active-learning-ad",
            classifier_builder: new SparseVecClassifierSVC(),
            dictionary: context.event_dictionary,
            max_n2p_ratio: config.max_n2p_ratio || -1,
            min_len: 40,
            supervizor,
            top_per_day: config.top_per_day || 3
        });
    }

    public async receive(data: any, _stream_id: string): Promise<void> {
        const ddata = data as IEventWindow;
        const alert = this.ad_ex.process(ddata);
        if (alert) {
            await this.emit_cb(alert, null);
        }
    }

    public heartbeat(): void {
        // empty
    }
    public async shutdown(): Promise<void> {
        // empty
    }
}
