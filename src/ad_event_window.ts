import * as qm from "qminer";
import { IEventWindow, IGdrRecord } from "./data_objects";
import { EventDictionary } from "./event_dictionary";
import { Triplet, Pair } from "./utils";

const DETECTOR_TYPE = "SupervisedSVM";

export interface IADProviderEventWindowParams {
    dictionary: EventDictionary;
    alert_source_name: string;
    n: number;
    min_len: number;
    external_evaluator: (arg: any) => number;
    ground_truth: (arg: IEventWindow) => number;
    external_interestingness: (arg: any) => number;
    rebuild_model: (data: Array<Pair<any, number>>) => void;
}

export class ADProviderEventWindow {

    private dictionary: EventDictionary;
    private daily_batch: Array<Triplet<IEventWindow, any, number>>;
    private global_batch: Array<Pair<any, number>>;
    private source_name: string;
    private next_day_switch: Date;
    private n: number;
    private min_len: number;
    private external_evaluator: (arg: any) => number;
    private ground_truth: (arg: IEventWindow) => number;
    private external_interestingness: (arg: any) => number;
    private rebuild_model: (data: Array<Pair<any, number>>) => void;

    constructor(params: IADProviderEventWindowParams) {
        this.dictionary = params.dictionary;
        this.source_name = params.alert_source_name;
        this.daily_batch = [];
        this.global_batch = [];
        this.next_day_switch = null;
        this.n = params.n;
        this.min_len = params.min_len;
        this.ground_truth = params.ground_truth;
        this.external_evaluator = params.external_evaluator;
        this.external_interestingness = params.external_interestingness;
        this.rebuild_model = params.rebuild_model;
    }

    public process(sample: IEventWindow): IGdrRecord {

        const vec = this.dictionary.createSparseVec(sample.names);
        const svec = new qm.la.SparseVector(vec);
        let result: IGdrRecord = null;

        this.processDaySwitch(sample.ts_start);

        // get classification
        const classification = this.external_evaluator(svec);
        if (classification !== 0) {
            result = {
                extra_data: {},
                tags: {
                    "$alert-source": this.source_name,
                    "$alert-type": DETECTOR_TYPE
                },
                ts: sample.ts_start,
                values: { classification }
            };
        }

        const interestingness = this.external_interestingness(svec);
        this.daily_batch.push({ val1: sample, val2: svec, val3: interestingness });

        return result;
    }

    private processDaySwitch(ts: Date): void {
        // if day-switch not initialized
        if (!this.next_day_switch) {
            this.setNewDaySwitch(ts);
            return;
        }
        if (ts > this.next_day_switch) {
            this.setNewDaySwitch(ts);

            // get the most promising examples
            const db = this.daily_batch
                .sort((a, b) => a.val3 - b.val3)
                .slice(0, this.n);

            // get external classification
            for (const example of db) {
                this.global_batch.push({
                    val1: example.val2,
                    val2: this.ground_truth(example.val1)
                });
            }
            if (this.global_batch.length >= this.min_len) {
                this.rebuild_model(this.global_batch);
            }

            this.daily_batch = [];
        }
    }

    private setNewDaySwitch(ts: Date) {
        const t = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
        t.setDate(ts.getDate() + 1);
        this.next_day_switch = t;
    }
}
