import * as q from "./qtopology";
import { EventWindowBolt } from "./bolt_ew";
import { AnomalyDetectorZScoreBolt, AnomalyDetectorQuantileBolt } from "./bolt_ad";
import { NearestNeighborBolt } from "./bolt_nn";
import { ConcatTagsBolt } from "./bolt_concat";
import { KafkaSpout, KafkaBolt } from "./kafka";

export function createBolts(subtype: string): q.IBolt {
    switch (subtype) {
        case "quantile_ad": return new AnomalyDetectorQuantileBolt();
        case "zscore_ad": return new AnomalyDetectorZScoreBolt();
        case "event_window": return new EventWindowBolt();
        case "nn": return new NearestNeighborBolt();
        case "concat_tags": return new ConcatTagsBolt();
        case "kafka": return new KafkaBolt();
        default: return null;
    }
}

export function createSpouts(subtype: string): q.ISpout {
    switch (subtype) {
        case "kafka": return new KafkaSpout();
        default: return null;
    }
}
