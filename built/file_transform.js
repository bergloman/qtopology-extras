"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lbl = require("line-by-line");
/**
 * This method will transform given input file
 * and write the result to output file.
 */
function transformFile(input_fname, output_fname, line_handler) {
    return new Promise((resolve, reject) => {
        let lr = new lbl(input_fname);
        let buffer = [];
        lr.on('error', reject);
        lr.on('line', (s) => {
            s = line_handler(s);
            if (s) {
                buffer.push(s);
            }
            if (buffer.length > 100) {
                fs.appendFileSync(output_fname, buffer.join("\n") + "\n");
                buffer = [];
            }
        });
        lr.on('end', () => {
            if (buffer.length > 0) {
                fs.appendFileSync(output_fname, buffer.join("\n") + "\n");
                buffer = [];
            }
            resolve();
        });
    });
}
exports.transformFile = transformFile;
