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

## Anomaly detectors

This anomaly detector uses quantile estimation to detect anomalies:

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
        "threshold_z": 3,
        "name_field": "tags.name",
        "value_field": "values.avg"
    }
}
```
