"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bolt_ew_1 = require("./bolt_ew");
const bolt_ad_1 = require("./bolt_ad");
const bolt_nn_1 = require("./bolt_nn");
const spout_kafka_1 = require("./spout_kafka");
function createBolts(subtype) {
    switch (subtype) {
        case "quantile_ad": return new bolt_ad_1.AnomalyDetectorQuantileBolt();
        case "zscore_ad": return new bolt_ad_1.AnomalyDetectorZScoreBolt();
        case "event_window": return new bolt_ew_1.EventWindowBolt();
        case "nn": return new bolt_nn_1.NearestNeighborBolt();
        default: return null;
    }
}
exports.createBolts = createBolts;
function createSpouts(subtype) {
    switch (subtype) {
        case "kafka": return new spout_kafka_1.KafkaSpout();
        default: return null;
    }
}
exports.createSpouts = createSpouts;
