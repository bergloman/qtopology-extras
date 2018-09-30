# QTopology extras

This repository contains analytics extensions to [qtopology](https://github.com/qminer/qtopology) using [QMiner](https://github.com/qminer/qminer).

These extensions are written in `Typescript`.

## Installation

TODO publish to npm

`````````````bash
npm install qtopology-extras
`````````````

## Intro

This repository contains the following extensions:

- Bolts that perform streaming operations such as windowing.
- Bolts performing anomaly detection.
- Spouts that connect to Kafka topics.
- Bolts that publish to Kafka topics.

## Common data formats

### GDR data

**General Data Record** contains timestamp, tags (simple string values) and values (simple numerics). Optionally, one can attach extra_data (arbitrary objects).

```json
{
    "ts": "2018-09-29T12:34:56",
    "tags": { "tag1": "a", "tag2": "b" },
    "values": { "avg": 123.456 },
    "extra_data": {
        "additional": [1, 2, 3],
        "version": {
            "major": 2,
            "minor": 1,
            "release_on": "2018-09-27"
        }
    }
}
```

### Events

Event contains name and timestamp

```json
{
    "ts": "2018-09-29T12:34:56",
    "name": "some_name"
}
```

Event windows:

```json
{
    "ts_start": "2018-09-29T12:34:56",
    "ts_end": "2018-09-29T12:44:56",
    "names": {
        "a": 12,
        "b": 5,
        "c": 89
    }
}
```

### Alerts

Alert is written as a GDR record. It contains timestamp, alert type, source of alerts, tags of input data and extra data that describes the alert. It contains two standard tags - `$alert-type` and `$alert-source`.

```json
{
    "ts": "2018-09-29T12:34:56",
    "tags": {
        "$alert-type": "quantile",
        "$alert-source": "bucket1.quantile",
        "tag1": "a",
        "tag2": "b"
    },
    "values": {
        "value": 1234,
        "cdf": 0.9921,
        "threshold_cdf":  0.99,
        "threshold_value":  1218
    },
    "extra_data": {}
}
```

## Anomaly detectors

### Quantile estimation

This anomaly detector uses quantile estimation to detect anomalies.

It uses name and value field queries. Name is used for separating values into buckets. Each bucket is being tracked separately.

```json
{
    "name": "bolt_ad",
    "working_dir": "qtopology-extras",
    "type": "module_method",
    "cmd": "createBolts",
    "subtype": "quantile_ad",
    "inputs": [{ "source": "bolt_input" }],
    "init": {
        "min_count": 1000,
        "threshold_low": 0.005,
        "threshold_high": 0.995,
        "name_field": "tags.name",
        "value_field": "values.avg"
    }
}
```

Example input:

```json
{
    "ts": "2018-09-29T12:34:56",
    "tags": { "tag1": "a", "tag2": "b" },
    "values": { "avg": 123.456 }
}
```

Example output contains same tags:

```json
{
    "ts": "2018-09-29T12:34:56",
    "tags": {
        "$alert-type": "quantile",
        "$alert-source": "bucket1.quantile",
        "tag1": "a",
        "tag2": "b"
    },
    "values": {
        "value": 1234,
        "cdf": 0.9921,
        "threshold_cdf":  0.99,
        "threshold_value":  1218
    },
    "extra_data": {}
}
```

### Z-score anomaly detection

This anomaly detector uses z-score to detect anomalies:

```json
{
    "name": "bolt_ad2",
    "working_dir": "qtopology-extras",
    "type": "module_method",
    "cmd": "createBolts",
    "subtype": "zscore_ad",
    "inputs": [{ "source": "bolt_input" }],
    "init": {
        "min_count": 1000,
        "threshold_z_pos": 3,
        "threshold_z_neg": -5,
        "name_field": "tags.name",
        "value_field": "values.avg"
    }
}
```

## Windowing operation

This bolt receives event stream and emits window statistics in regular time intervals:

```json
{
    "name": "bolt_processing_ew",
    "working_dir": "qtopology-extras",
    "type": "module_method",
    "cmd": "createBolts",
    "subtype": "event_window",
    "inputs": [{ "source": "input" }],
    "init": {
        "window_len": 1800000,
        "step": 600000,
        "name_field": "path.to.name",
        "ts_field": "path.to.ts",
    }
}
```

This example emits statistics for 30-minute sliding windows, every 10 minutes.

Example input:

```json
{
    "ts": "2018-09-29T12:34:56",
    "name": "some_name"
}
```

Example output contains same tags:

```json
{
    "ts_start": "2018-09-29T12:20:00",
    "ts_end": "2018-09-29T12:30:00",
    "names": {
        "some_name": 2,
        "some_name2": 1,
        "some_name3": 1
    }
}
```
