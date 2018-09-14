import * as q from "../../../qtopology";
import { EventWindowBolt } from "./bolt_ew";
import { AnomalyDetectorQuantileBolt } from "./bolt_ad";
import { NearestNeighborBolt } from "./bolt_nn";
import { KafkaSpout } from "./spout_kafka";

export function createBolts(subtype: string): q.Bolt {
    switch (subtype) {
        case "quantile_ad": return new AnomalyDetectorQuantileBolt();
        case "event_window": return new EventWindowBolt();
        case "nn": return new NearestNeighborBolt();
        default: return null;
    }
}

export function createSpouts(subtype: string): q.Spout {
    switch (subtype) {
        case "kafka": return new KafkaSpout();
        default: return null;
    }
}
