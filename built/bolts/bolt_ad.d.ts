import * as t from "../ad";
import * as q from "../../../qtopology";
/** Base class for scalar anomaly detector */
export declare abstract class AnomalyDetectorBaseBolt implements q.Bolt {
    private inner;
    private emit_cb;
    private transform_helper;
    private detector_postfix;
    protected alert_type: string;
    constructor();
    init(name: string, config: any, _context: any, callback: q.SimpleCallback): void;
    abstract innerInit(config: any): t.IADProviderScalarFactory;
    heartbeat(): void;
    shutdown(callback: q.SimpleCallback): void;
    receive(data: any, _stream_id: string, callback: q.SimpleCallback): void;
}
/** Anomaly detector using quantiles */
export declare class AnomalyDetectorQuantileBolt extends AnomalyDetectorBaseBolt {
    constructor();
    innerInit(config: any): t.IADProviderScalarFactory;
}
/** ANomaly detector using ZScore */
export declare class AnomalyDetectorZScoreBolt extends AnomalyDetectorBaseBolt {
    constructor();
    innerInit(config: any): t.IADProviderScalarFactory;
}
