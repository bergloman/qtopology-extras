import * as qm from "qminer";
import { IEventWindow, IGdrRecord } from "./data_objects";
import { EventDictionary } from "./event_dictionary";
import { Triplet, Pair } from "./utils";

const DETECTOR_TYPE = "SupervisedSVM";

export interface IClassiffier {
    classify: (arg: any) => number;
}

export interface IClassiffierBuilder {
    build: (data: Array<Pair<any, number>>) => IClassiffier;
}

export interface ISupervisor {
    isAnomaly: (arg: IEventWindow) => number;
}

export interface IADProviderEventWindowParams {
    dictionary: EventDictionary;
    alert_source_name: string;
    top_per_day: number;
    min_len: number;
    supervizor: ISupervisor;
    classifier_builder: IClassiffierBuilder;
}

export class ADProviderEventWindow {

    private dictionary: EventDictionary;
    private daily_batch: Array<Triplet<IEventWindow, any, number>>;
    private global_batch: Array<Pair<any, number>>;
    private source_name: string;
    private next_day_switch: Date;
    private top_per_day: number;
    private min_len: number;
    private supervizor: ISupervisor;
    private classifier_builder: IClassiffierBuilder;
    private classifier: IClassiffier;

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

        const vec = this.dictionary.createSparseVec(sample.names);
        const svec = new qm.la.SparseVector(vec);
        let result: IGdrRecord = null;

        this.processDaySwitch(sample.ts_start);

        // default measure of interestingess is the norm of the vector
        let interestingness = svec.norm();

        if (this.classifier) {
            const classification = this.classifier.classify(svec);
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
            // classification score is now better measure of interestingness
            interestingness = classification;
        }

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
                .slice(0, this.top_per_day);

            // get external classification
            for (const example of db) {
                this.global_batch.push({
                    val1: example.val2,
                    val2: this.supervizor.isAnomaly(example.val1)
                });
            }
            // (re)build classifier if enough data has been collected
            if (this.global_batch.length >= this.min_len) {
                this.classifier = this.classifier_builder.build(this.global_batch);
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
