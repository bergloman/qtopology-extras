import * as q from "./qtopology";
import { EventWindowBolt } from "./bolt_ew";
import { AnomalyDetectorZScoreBolt, AnomalyDetectorQuantileBolt, AnomalyDetectorThresholdBolt } from "./bolt_ad";
import { NearestNeighborBolt } from "./bolt_nn";
import { ConcatTagsBolt } from "./bolt_concat";
import { KafkaSpout, KafkaBolt } from "./kafka";
import { ActiveLearningEWBolt } from "./bolt_active_learning_ew";
import { ResamplerBolt } from "./bolt_resampler";
import { RegularizatorBolt, NormalizatorBolt, EmaBolt } from "./bolt_regularizator";
import { MetricCollectorBolt, MetricNCollectorBolt } from "./bolt_collector";
import { PcaBolt } from "./bolt_pca";
import { LongtermChangeBolt } from "./bolt_longterm";
import { MemoryUsageBolt } from "./bolt_memory_usage";

/** Factory for bolts in this module */
export function createBolts(subtype: string): q.IBolt {
    switch (subtype) {
        case "quantile_ad": return new AnomalyDetectorQuantileBolt();
        case "zscore_ad": return new AnomalyDetectorZScoreBolt();
        case "threshold": return new AnomalyDetectorThresholdBolt();
        case "resampler": return new ResamplerBolt();
        case "regularizator": return new RegularizatorBolt();
        case "normalizator": return new NormalizatorBolt();
        case "metric_collector": return new MetricCollectorBolt();
        case "metric_collector_n": return new MetricNCollectorBolt();
        case "event_window": return new EventWindowBolt();
        case "nn": return new NearestNeighborBolt();
        case "pca": return new PcaBolt();
        case "ema": return new EmaBolt();
        case "longterm_ad": return new LongtermChangeBolt();
        case "concat_tags": return new ConcatTagsBolt();
        case "kafka": return new KafkaBolt();
        case "memory_usage": return new MemoryUsageBolt();
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
