import { Pair } from "./utils";

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

/** Timeseries point */
export interface ITsPoint {
    val: number;
    ts: Date;
}

/** Timeseries point */
export class TsPoint implements ITsPoint {
    public val: number;
    public ts: Date;
}

/** Timeseries point with timestamp as number */
export interface ITsPointN {
    val: number;
    ts: number;
}

/** Timeseries point with timestamp as number */
export class TsPointN implements ITsPointN {
    public val: number;
    public ts: number;
}

/** Metric - named timeseries point */
export interface IMetric extends ITsPoint {
    name: string;
}

/** Metric - named timeseries point */
export class Metric extends TsPoint implements IMetric {
    public name: string;
}

/** Metric - named timeseries point */
export interface IMetricN extends ITsPointN {
    name: string;
}

/** Metric - named timeseries point */
export class MetricN extends TsPointN implements IMetricN {
    public name: string;
}

/** Simple event */
export interface IEvent {
    name: string;
    ts: Date;
}

/** Bag-of-events */
export interface IEventCounts {
    [key: string]: number;
}

/** Window of events */
export interface IEventWindow {
    ts_start: Date;
    ts_end: Date;
    names: IEventCounts;
    vec_len_one_hot: number;
    vec_len: number;
}

/** Sparse vectors look like [[dim0, val0], [dim1, val1], ...] */
export type SparseVec = number[][];

/** Learning example for classifiers */
export type LearningExample = Pair<SparseVec, number>;

/** Learning example for classifiers - dense */
export type LearningExampleDense = Pair<number[], number>;

/** Provides evaluation of event-window */
export interface IEventWindowSupervisor {
    isAnomaly: (arg: IEventWindow) => boolean;
}

/** Binary classifier for sparse vectors */
export interface ISparseVecClassiffier {
    classify: (arg: SparseVec) => number;
}

/** Factory for binary classifier for sparse vectors */
export interface ISparseVecClassiffierBuilder {
    build: (data: LearningExample[]) => ISparseVecClassiffier;
}

/** Regression for dense vectors */
export interface IRegression {
    predict: (arg: number[]) => number;
}

/** Factory for regression */
export interface IRegressionBuilder {
    build: (data: LearningExampleDense[]) => IRegression;
}

