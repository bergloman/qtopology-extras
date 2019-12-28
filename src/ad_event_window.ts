import * as qm from "qminer";
// import * as fs from "fs";
import {
    IEventWindow, IGdrRecord,
    IEventWindowSupervisor, ISparseVecClassiffierBuilder, ISparseVecClassiffier,
    SparseVec, LearningExample, getRandomPermutation
} from "./data_objects";
import { EventDictionary } from "./event_dictionary";

const DETECTOR_TYPE = "SupervisedSVM";

export interface IADProviderEventWindowParams {
    dictionary: EventDictionary;
    alert_source_name: string;
    top_per_day: number;
    min_len: number;
    max_n2p_ratio: number;
    supervizor: IEventWindowSupervisor;
    classifier_builder: ISparseVecClassiffierBuilder;
    use_least_conf: boolean;
    use_most_conf: boolean;
    use_random_neg: boolean;
    use_undetected: boolean;
    use_unsup: boolean;
}

class DailyBatchRec {
    public event_window: IEventWindow;
    public sparse_vec: SparseVec;
    public interestingness_unsup: number;
    public interestingness_undecided: number;
    public interestingness_confident: number;
    public prediction: number;
    public is_true_anomaly: number;
}

export class ADProviderEventWindow {

    private dictionary: EventDictionary;
    private daily_batch: DailyBatchRec[];
    private global_batch: LearningExample[];
    private source_name: string;
    private next_day_switch: Date;
    private top_per_day: number;
    private min_len: number;
    private max_n2p_ratio: number;
    private supervizor: IEventWindowSupervisor;
    private classifier_builder: ISparseVecClassiffierBuilder;
    private classifier: ISparseVecClassiffier;
    private use_least_conf: boolean;
    private use_most_conf: boolean;
    private use_random_neg: boolean;
    private use_unsup: boolean;
    private use_undetected: boolean;
    private daily_stats: any;
    private global_stats: any;

    constructor(params: IADProviderEventWindowParams) {
        this.dictionary = params.dictionary;
        this.source_name = params.alert_source_name;
        this.daily_batch = [];
        this.global_batch = [];
        this.next_day_switch = null;
        this.top_per_day = params.top_per_day;
        this.min_len = params.min_len;
        this.max_n2p_ratio = params.max_n2p_ratio;

        this.use_least_conf = params.use_least_conf;
        this.use_most_conf = params.use_most_conf;
        this.use_random_neg = params.use_random_neg;
        this.use_undetected = params.use_undetected;
        this.use_unsup = params.use_unsup;

        this.supervizor = params.supervizor;
        this.classifier_builder = params.classifier_builder;
        this.classifier = null;

        this.daily_stats = new qm.analytics.metrics.ClassificationScore();
        this.global_stats = new qm.analytics.metrics.ClassificationScore();
    }

    public process(sample: IEventWindow): IGdrRecord {

        this.processDaySwitch(sample.ts_start);

        const vec = this.dictionary.createSparseVec(sample.names);
        let result: IGdrRecord = null;

        const svec = new qm.la.SparseVector(vec);
        const interestingness_unsup = svec.norm(); // default measure of interestingess is the norm of the vector
        let interestingness_undecided = 0; // second interestingess is when classifier returns positive answer
        let interestingness_confident = 0;
        let classification = 0;
        const is_true_anomaly = this.supervizor.isAnomaly(sample) ? 1 : 0;
        if (this.classifier) {
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
                // confident only about positive predictions
                interestingness_confident = decisionFunction * (classification > 0 ? 1 : 0);
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
            this.daily_stats.push(is_true_anomaly, classification);
            this.global_stats.push(is_true_anomaly, classification);
        }

        this.daily_batch.push({
            event_window: sample,
            interestingness_confident,
            interestingness_undecided,
            interestingness_unsup,
            is_true_anomaly,
            prediction: classification,
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

            const ts_s = ts.toISOString().replace(/\:/g, "").replace(/\-/g, "").slice(0, 8 + 6 + 1);

            // output classification scores, reset daily score
            const fmt = (sc) => `TP=${sc.TP} TN=${sc.TN} FP=${sc.FP} FN=${sc.FN}`;
            console.log(ts_s, "daily_stats", fmt(this.daily_stats.scores));
            console.log(ts_s, "global_batch", fmt(this.global_stats.scores));
            this.daily_stats = new qm.analytics.metrics.ClassificationScore();

            // const MAX_BUCKETS = 5;
            // console.log("Day switch", ts);
            this.setNewDaySwitch(ts);
            this.daily_batch = this.daily_batch
                .filter(x => x.sparse_vec.length > 0);

            // get the most promising examples by all measures of interestingness
            let new_examples = [];

            // the highest unsupervized score
            if (this.use_most_conf) {
                const db1 = this.daily_batch
                    .sort((a, b) => b.interestingness_unsup - a.interestingness_unsup) // sort descending
                    // .slice(0, MAX_BUCKETS * this.top_per_day)
                    .filter(x => new_examples.indexOf(x) < 0)
                    .slice(0, this.top_per_day);
                this.addNewExamples(db1);
                new_examples = new_examples.concat(db1);
                console.log("-- new examples - most conf", db1.length);
            }

            // the most undecided supervized score
            if (this.use_least_conf) {
                const db2 = this.daily_batch
                    .sort((a, b) => b.interestingness_undecided - a.interestingness_undecided) // sort descending
                    // .slice(0, MAX_BUCKETS * this.top_per_day)
                    .filter(x => new_examples.indexOf(x) < 0)
                    .slice(0, this.top_per_day);
                this.addNewExamples(db2);
                new_examples = new_examples.concat(db2);
                console.log("-- new examples - least conf", db2.length);
            }

            // the most certain supervized score
            if (this.use_unsup) {
                const db3 = this.daily_batch
                    .sort((a, b) => b.interestingness_confident - a.interestingness_confident) // sort descending
                    // .slice(0, MAX_BUCKETS * this.top_per_day)
                    .filter(x => new_examples.indexOf(x) < 0)
                    .slice(0, this.top_per_day);
                this.addNewExamples(db3);
                new_examples = new_examples.concat(db3);
                console.log("-- new examples - unsup", db3.length);
            }

            // append true anomalies if not detected so far
            if (this.use_undetected) {
                const db4 = this.daily_batch
                    .filter(x => x.is_true_anomaly)
                    .sort((a, b) => b.is_true_anomaly - a.is_true_anomaly) // sort descending
                    // .slice(0, MAX_BUCKETS * this.top_per_day)
                    .filter(x => new_examples.indexOf(x) < 0)
                    .slice(0, this.top_per_day);
                this.addNewExamples(db4);
                new_examples = new_examples.concat(db4);
                console.log("-- new examples - undetected", db4.length);
            }

            // random sample from that day
            if (this.use_random_neg) {
                const daily_sample = getRandomPermutation(this.daily_batch.length);
                const db5 = [];
                for (let i = 0; i < this.daily_batch.length; i++) {
                    const x = this.daily_batch[daily_sample[i]];
                    if (new_examples.indexOf(x) < 0) {
                        db5.push(x);
                        if (db5.length >= this.top_per_day) {
                            break;
                        }
                    }
                }
                this.addNewExamples(db5);
                new_examples = new_examples.concat(db5);
                console.log("-- new examples - random neg", db5.length);
            }

            // console.log("-- new examples", new_examples.length, db1.length, db2.length, db3.length/*, db5.length*/);
            // console.log("-- new examples", this.global_batch);
            // fs.writeFileSync(
            //     `.\\out\\global_batch.${ts_s}.ldjson`,
            //     JSON.stringify(this.global_batch),
            //     { encoding: "utf8" }
            // );

            // get external classification
            // this.addNewExamples(new_examples);
            const tp = this.global_batch.filter(x => x.val2 > 0).length;
            console.log(`ts: ${ts_s}, all ${this.global_batch.length}, TP: ${tp}`);
            // (re)build classifier if enough data has been collected
            if (this.global_batch.length >= this.min_len && tp > 0) {
                try {
                    // console.log("-- rebuilding classifier", this.global_batch.length, tp);
                    let training_data = this.global_batch;

                    if (this.max_n2p_ratio > 0) {
                        // sample negative example to decrease data imbalance
                        const positives = training_data.filter(x => x.val2 > 0);
                        let negatives = training_data.filter(x => x.val2 <= 0);

                        const negatives_allowed = Math.ceil(positives.length * this.max_n2p_ratio);
                        if (negatives_allowed < negatives.length) {
                            // we need to subsample negative examples
                            const permutation = getRandomPermutation(negatives.length);
                            const negatives_original = negatives;
                            negatives = new Array(negatives_allowed);
                            for (let i = 0; i < negatives_allowed; i++) {
                                negatives[i] = negatives_original[permutation[i]];
                            }
                        }
                        training_data = positives.concat(negatives);
                    }
                    this.classifier = this.classifier_builder.build(training_data);

                    // const output = this.global_batch.map(x => ({
                    //     cl: x.val2,
                    //     vals: x.val1.map(y => this.dictionary.getName(y[0]))
                    // }));
                    // fs.writeFileSync(
                    //     `.\\out\\global_batch.${ts_s}.ldjson`,
                    //     JSON.stringify(output, null, "  "),
                    //     { encoding: "utf8" }
                    // );
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
        // console.log(results);
    }

    private setNewDaySwitch(ts: Date) {
        const t = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate());
        t.setDate(ts.getDate() + 1);
        // const t = new Date(ts.getTime() + 6 * 60 * 60 * 1000);
        this.next_day_switch = t;
    }
}
