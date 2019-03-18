import * as qm from "qminer";
import * as fs from "fs";
import {
    IEventWindow, IGdrRecord,
    IEventWindowSupervisor, ISparseVecClassiffierBuilder, ISparseVecClassiffier,
    SparseVec, LearningExample
} from "./data_objects";
import { EventDictionary } from "./event_dictionary";
// import { Triplet } from "./utils";

const DETECTOR_TYPE = "SupervisedSVM";

export interface IADProviderEventWindowParams {
    dictionary: EventDictionary;
    alert_source_name: string;
    top_per_day: number;
    min_len: number;
    supervizor: IEventWindowSupervisor;
    classifier_builder: ISparseVecClassiffierBuilder;
}

// type DailyBatchRec = Triplet<IEventWindow, SparseVec, number>;
class DailyBatchRec {
    public event_window: IEventWindow;
    public sparse_vec: SparseVec;
    public interestingness1: number;
    public interestingness2: number;
}

export class ADProviderEventWindow {

    private dictionary: EventDictionary;
    private daily_batch: DailyBatchRec[];
    private global_batch: LearningExample[];
    private source_name: string;
    private next_day_switch: Date;
    private top_per_day: number;
    private min_len: number;
    private supervizor: IEventWindowSupervisor;
    private classifier_builder: ISparseVecClassiffierBuilder;
    private classifier: ISparseVecClassiffier;

    constructor(params: IADProviderEventWindowParams) {
        this.dictionary = params.dictionary;
        this.source_name = params.alert_source_name;
        this.daily_batch = [];
        this.global_batch = [];
        this.next_day_switch = null;
        this.top_per_day = params.top_per_day;
        this.min_len = params.min_len;

        this.supervizor = params.supervizor;
        this.classifier_builder = params.classifier_builder;
        this.classifier = null;
    }

    public process(sample: IEventWindow): IGdrRecord {

        this.processDaySwitch(sample.ts_start);

        const vec = this.dictionary.createSparseVec(sample.names);
        let result: IGdrRecord = null;

        const svec = new qm.la.SparseVector(vec);
        const interestingness1 = svec.norm(); // default measure of interestingess is the norm of the vector
        let interestingness2 = interestingness1; // second interestingess is when classifier returns positive answer
        if (this.classifier) {
            let classification = 0;
            try {
                classification = this.classifier.classify(vec);
            } catch (e) {
                console.log("ERROR");
                console.log(sample);
                console.log(e);
            }
            if (classification > 0) {
                result = {
                    extra_data: {},
                    tags: {
                        "$alert-source": this.source_name,
                        "$alert-type": DETECTOR_TYPE
                    },
                    ts: sample.ts_start,
                    values: { classification }
                };
                interestingness2 += 1000;
            }
        }

        this.daily_batch.push({
            event_window: sample,
            sparse_vec: vec,
            interestingness1,
            interestingness2
        });
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

            // get the most promising examples by both measures of interestingness
            const db1 = this.daily_batch
                .sort((a, b) => b.interestingness1 - a.interestingness1) // sort descending
                .slice(0, this.top_per_day);
            const db2 = this.daily_batch
                .sort((a, b) => b.interestingness2 - a.interestingness2) // sort descending
                .slice(0, this.top_per_day)
                .filter(x => db1.indexOf(x) < 0);

            // get external classification
            for (const example of db1.concat(db2)) {
                this.global_batch.push({
                    val1: example.sparse_vec,
                    val2: this.supervizor.isAnomaly(example.event_window) ? 1 : -1
                });
            }
            const tp = this.global_batch.filter(x => x.val2 > 0).length;

            // (re)build classifier if enough data has been collected
            if (this.global_batch.length >= this.min_len && tp > 0) {
                try {
                    this.classifier = this.classifier_builder.build(this.global_batch);
                    fs.writeFileSync(
                        ".\\out\\global_batch.ldjson",
                        JSON.stringify(this.global_batch),
                        { encoding: "utf8" }
                    );
                } catch (e) {
                    console.log(e);
                }
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
