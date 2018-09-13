"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const tdigest = require("tdigest");
const lbl = require("line-by-line");
/**
 * This method will perform quantilization of given input file
 * and write the result to output file.
 */
function quantilizeCsvFile(options) {
    return new Promise((resolve, reject) => {
        let { input_fname, output_fname, col_index_min, col_index_max, dec_places, min_examples_for_digest } = options;
        console.log("Reading input file", input_fname);
        let line_counter = 0;
        let tdigests = [];
        function line_handler(line) {
            if (line_counter++ == 0) {
                let col_names_old = line.split(",");
                let col_names_new = col_names_old
                    .slice(col_index_min, col_index_max + 1)
                    .map(x => x + "_q");
                for (let i = 0; i < col_names_new.length; i++) {
                    tdigests.push(new tdigest.TDigest());
                }
                ;
                fs.writeFileSync(output_fname, col_names_old.join(",") + "," + col_names_new.join(",") + "\n");
            }
            else {
                // parse data
                let vals_split = line
                    .split(",");
                // slice to required columns
                let vals = vals_split
                    .slice(col_index_min, col_index_max + 1)
                    .map(x => +x);
                // update digests, emit data if above minimum rec count
                let new_vals = [];
                for (let i = 0; i < vals.length; i++) {
                    const val = vals[i];
                    const digest = tdigests[i];
                    if (line_counter > min_examples_for_digest) {
                        new_vals.push(digest.p_rank(val));
                    }
                    digest.push(val);
                }
                if (new_vals.length == 0)
                    return;
                // output to file
                new_vals = new_vals.map(x => x.toFixed(dec_places));
                fs.appendFileSync(output_fname, vals_split.join(",") + "," + new_vals.join(",") + "\n");
            }
            if (line_counter % 10000 == 0) {
                console.log("Processed:", line_counter);
            }
        }
        ;
        let lr = new lbl(input_fname);
        lr.on('error', reject);
        lr.on('line', line_handler);
        lr.on('end', () => {
            resolve(line_counter - min_examples_for_digest);
        });
    });
}
exports.quantilizeCsvFile = quantilizeCsvFile;
