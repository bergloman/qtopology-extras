const assert = require("assert");

exports.approxEqual = function (actual, expected, eps) {
    eps = eps || 0.00001;
    assert.ok(actual < expected + eps, `Actual mvalue (${actual}) is not close to expected (${expected}). Eps = ${eps}`);
    assert.ok(actual > expected - eps, `Actual mvalue (${actual}) is not close to expected (${expected}). Eps = ${eps}`);
}
