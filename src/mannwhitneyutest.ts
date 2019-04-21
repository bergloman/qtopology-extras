/////////////////////////////////////////////////////////////////////
// Adapted from:
// https://gist.github.com/gungorbudak/1c3989cc26b9567c6e50
/////////////////////////////////////////////////////////////////////

/*
 * Standard ranking
 *
 * The MIT License, Copyright (c) 2014 Ben Magyar
 */
function standard(array: any[], key: string): any[] {
    // sort the array
    array = array.sort((a, b) => {
        const x = a[key];
        const y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    // assign a naive ranking
    for (let i = 1; i < array.length + 1; i++) {
        array[i - 1].rank = i;
    }
    return array;
}

/*
 * Fractional ranking
 *
 * The MIT License, Copyright (c) 2014 Ben Magyar
 */
function fractional(array: any[], key: string): any[] {
    array = standard(array, key);
    // now apply fractional
    let pos = 0;
    while (pos < array.length) {
        let sum = 0;
        let i = 0;
        for (i = 0; array[pos + i + 1] && (array[pos + i][key] === array[pos + i + 1][key]); i++) {
            sum += array[pos + i].rank;
        }
        sum += array[pos + i].rank;
        const endPos = pos + i + 1;
        for (pos; pos < endPos; pos++) {
            array[pos].rank = sum / (i + 1);
        }
        pos = endPos;
    }
    return array;
}

function rank(x: number[], y: number[]): any[] {
    let nx = x.length;
    let ny = y.length;
    const combined = [];
    while (nx--) {
        combined.push({ set: "x", val: x[nx] });
    }
    while (ny--) {
        combined.push({ set: "y", val: y[ny] });
    }
    return fractional(combined, "val");
}

/*
* Error function
*
* The MIT License, Copyright (c) 2013 jStat
*/
function erf(x: number): number {
    const cof = [
        -1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2, -9.561514786808631e-3,
        -9.46595344482036e-4, 3.66839497852761e-4,
        4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6,
        1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8,
        6.529054439e-9, 5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11,
        2.394038e-12, -6.886027e-12, 8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15,
        -1.523e-15, -9.4e-17, 1.21e-16, -2.8e-17
    ];
    let j = cof.length - 1;
    let isneg = false;
    let d = 0;
    let dd = 0;

    if (x < 0) {
        x = -x;
        isneg = true;
    }

    const t = 2 / (2 + x);
    const ty = 4 * t - 2;

    for (; j > 0; j--) {
        const tmp = d;
        d = ty * d - dd + cof[j];
        dd = tmp;
    }

    const res = t * Math.exp(-x * x + 0.5 * (cof[0] + ty * d) - dd);
    return isneg ? res - 1 : 1 - res;
}

/*
* Normal distribution CDF
*
* The MIT License, Copyright (c) 2013 jStat
*/
function dnorm(x: number, mean: number, std: number): number {
    return 0.5 * (1 + erf((x - mean) / Math.sqrt(2 * std * std)));
}

function statistic(x: number[], y: number[]): any {
    const ranked = rank(x, y);
    const nr = ranked.length;
    const nx = x.length;
    const ny = y.length;
    const ranksums = { x: 0, y: 0 };
    let i = 0;
    let t = 0;
    let nt = 1;

    while (i < nr) {
        if (i > 0) {
            if (ranked[i].val == ranked[i - 1].val) {
                nt++;
            } else {
                if (nt > 1) {
                    t += Math.pow(nt, 3) - nt;
                    nt = 1;
                }
            }
        }
        ranksums[ranked[i].set] += ranked[i].rank;
        i++;
    }
    const tcf = 1 - (t / (Math.pow(nr, 3) - nr));
    const ux = nx * ny + (nx * (nx + 1) / 2) - ranksums.x;
    const uy = nx * ny - ux;

    return {
        big: Math.max(ux, uy),
        small: Math.min(ux, uy),
        tcf,
        ux,
        uy
    };
}

export interface IMannWhitneyUTestResult {
    U: number;
    p: number;
}

export function test(x: number[], y: number[], alt: string): IMannWhitneyUTestResult {
    // set default value for alternative
    alt = typeof alt !== "undefined" ? alt : "two-sided";
    // set default value for continuity
    // corr = typeof corr !== "undefined" ? corr : true;
    const nx = x.length; // x's size
    const ny = y.length; // y's size
    let f = 1;

    // test statistic
    const u = statistic(x, y);
    let mu: number = 0;
    let z = 0;

    // mean compute and correct if given
    mu = (nx * ny / 2) + 0.5;
    // if (corr) {
    //     mu = (nx * ny / 2) + 0.5;
    // } else {
    //     mu = nx * ny / 2;
    // }

    // compute standard deviation using tie correction factor
    const std = Math.sqrt(u.tcf * nx * ny * (nx + ny + 1) / 12);

    // compute z according to given alternative
    if (alt == "less") {
        z = (u.ux - mu) / std;
    } else if (alt == "greater") {
        z = (u.uy - mu) / std;
    } else if (alt == "two-sided") {
        z = Math.abs((u.big - mu) / std);
    } else {
        console.log("Unknown alternative argument");
    }

    // factor to correct two sided p-value
    if (alt == "two-sided") {
        f = 2;
    }

    // compute p-value using CDF of standard normal
    const p = dnorm(-z, 0, 1) * f;

    return { U: u.small, p };
}
