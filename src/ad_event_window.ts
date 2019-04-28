import * as qm from "qminer";
import * as fs from "fs";
import {
    IEventWindow, IGdrRecord,
    IEventWindowSupervisor, ISparseVecClassiffierBuilder, ISparseVecClassiffier,
    SparseVec, LearningExample
} from "./data_objects";
import { EventDictionary } from "./event_dictionary";

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
    public interestingness_unsup: number;
    public interestingness_undecided: number;
    public interestingness_confident: number;
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
        const interestingness_unsup = svec.norm(); // default measure of interestingess is the norm of the vector
        let interestingness_undecided = 0; // second interestingess is when classifier returns positive answer
        let interestingness_confident = 0;
        if (this.classifier) {
            let classification = 0;
            try {
                classification = this.classifier.classify(vec);
            } catch (e) {
                console.log("ERROR");
                console.log(sample);
                console.log(e);
            }
            let decisionFunction: number = -1;
            try {
                // interestingness is the inverse of distance to decision boundary
                decisionFunction = this.classifier.decisionFunction(vec);
                interestingness_undecided = 1 / (1 + Math.abs(decisionFunction));
                interestingness_confident = decisionFunction;
            } catch (e) {
                console.log("ERROR in decisionFunction");
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
                    values: { classification, decisionFunction }
                };
            }
        }

        this.daily_batch.push({
            event_window: sample,
            interestingness_confident,
            interestingness_undecided,
            interestingness_unsup,
            sparse_vec: vec
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
            // console.log("Day switch", ts);
            this.setNewDaySwitch(ts);
            this.daily_batch = this.daily_batch
                .filter(x => x.sparse_vec.length > 0);

            // get the most promising examples by all measures of interestingness
            let new_examples = [];
            const db1 = this.daily_batch
                .sort((a, b) => b.interestingness_unsup - a.interestingness_unsup) // sort descending
                .slice(0, 2 * this.top_per_day)
                .filter(x => new_examples.indexOf(x) < 0)
                .slice(0, this.top_per_day);
            // const len1 = db1.length;
            this.addNewExamples(db1);

            new_examples = new_examples.concat(db1);

            const db2 = this.daily_batch
                .sort((a, b) => b.interestingness_undecided - a.interestingness_undecided) // sort descending
                .slice(0, 2 * this.top_per_day)
                .filter(x => new_examples.indexOf(x) < 0)
                .slice(0, this.top_per_day);
            // const len2 = db2.length;
            this.addNewExamples(db2);

            new_examples = new_examples.concat(db2);

            const db3 = this.daily_batch
                .sort((a, b) => b.interestingness_confident - a.interestingness_confident) // sort descending
                .slice(0, 2 * this.top_per_day)
                .filter(x => new_examples.indexOf(x) < 0)
                .slice(0, this.top_per_day);
            // const len3 = db3.length;

            this.addNewExamples(db3);
            // new_examples = new_examples.concat(db3);

            // console.log("-- new examples", len1, len2, len3);

            // get external classification
            // this.addNewExamples(new_examples);
            const tp = this.global_batch.filter(x => x.val2 > 0).length;

            // (re)build classifier if enough data has been collected
            if (this.global_batch.length >= this.min_len && tp > 0) {
                try {
                    // console.log("-- rebuilding classifier", this.global_batch.length, tp);
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

    private addNewExamples(new_examples: DailyBatchRec[]) {
        const results: boolean[] = [];
        for (const example of new_examples) {
            const is_anomaly = this.supervizor.isAnomaly(example.event_window);
            this.global_batch.push({
                val1: example.sparse_vec,
                val2: is_anomaly ? 1 : -1
            });
            results.push(is_anomaly);
        }
        console.log(results);
    }

    private setNewDaySwitch(ts: Date) {
        const t = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
        t.setDate(ts.getDate() + 1);
        this.next_day_switch = t;
    }
}
