import * as q from "./qtopology";
import { EventWindowBolt } from "./bolt_ew";
import { AnomalyDetectorZScoreBolt, AnomalyDetectorQuantileBolt } from "./bolt_ad";
import { NearestNeighborBolt } from "./bolt_nn";
import { ConcatTagsBolt } from "./bolt_concat";
import { KafkaSpout, KafkaBolt } from "./kafka";
import { ActiveLearningEWBolt } from "./bolt_active_learning_ew";
import { ResamplerBolt } from "./bolt_resampler";
import { RegularizatorBolt, NormalizatorBolt } from "./bolt_regularizator";
import { MetricCollectorBolt, MetricNCollectorBolt } from "./bolt_collector";

/** Factory for bolts in this module */
export function createBolts(subtype: string): q.IBolt {
    switch (subtype) {
        case "quantile_ad": return new AnomalyDetectorQuantileBolt();
        case "zscore_ad": return new AnomalyDetectorZScoreBolt();
        case "resampler": return new ResamplerBolt();
        case "regularizator": return new RegularizatorBolt();
        case "normalizator": return new NormalizatorBolt();
        case "metric_collector": return new MetricCollectorBolt();
        case "metric_collector_n": return new MetricNCollectorBolt();
        case "event_window": return new EventWindowBolt();
        case "nn": return new NearestNeighborBolt();
        case "concat_tags": return new ConcatTagsBolt();
        case "kafka": return new KafkaBolt();
        case "active_learning_ew": return new ActiveLearningEWBolt();
        default: return null;
    }
}

/** Factory for spouts in this module */
export function createSpouts(subtype: string): q.ISpout {
    switch (subtype) {
        case "kafka": return new KafkaSpout();
        default: return null;
    }
}
