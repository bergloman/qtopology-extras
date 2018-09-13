"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bolt_ew_1 = require("./bolt_ew");
const bolt_ad_1 = require("./bolt_ad");
const bolt_nn_1 = require("./bolt_nn");
function createBolts(subtype) {
    switch (subtype) {
        case "quantile_ad": return new bolt_ad_1.AnomalyDetectorQuantileBolt();
        case "event_window": return new bolt_ew_1.EventWindowBolt();
        case "nn": return new bolt_nn_1.NearestNeighborBolt();
        default: return null;
    }
}
exports.createBolts = createBolts;
