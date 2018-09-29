/** Tags for GDR record */
export interface IGdrTags {
    [key: string]: string;
}
/** (Numeric) values for GDR record */
export interface IGdrValues {
    [key: string]: number;
}
/** General Data Record */
export interface IGdrRecord {
    ts: Date;
    tags: IGdrTags;
    values: IGdrValues;
    extra_data?: any;
}
/** Simple event */
export interface IEvent {
    name: string;
    ts: Date;
}
export interface IEventCounts {
    [key: string]: number;
}
export interface IEventWindow {
    ts_start: Date;
    ts_end: Date;
    names: IEventCounts;
}
