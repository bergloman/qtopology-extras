import * as fs from "fs";
import * as tdigest from "tdigest";
import * as lbl from "line-by-line";

export interface IQuantilizeCsvFileParams {
    input_fname: string;
    output_fname: string;
    col_index_min: number;
    col_index_max: number;
    dec_places: number;
    min_examples_for_digest: number;
}

/**
 * This method will perform quantilization of given input file
 * and write the result to output file.
 */
export function quantilizeCsvFile(options: IQuantilizeCsvFileParams) {
    return new Promise((resolve, reject) => {

        const { input_fname, output_fname, col_index_min,
            col_index_max, dec_places, min_examples_for_digest } = options;

        console.log("Reading input file", input_fname);
        let line_counter = 0;
        const tdigests = [];

        function line_handler(line: string) {
            if (line_counter++ == 0) {
                const col_names_old = line.split(",");
                const col_names_new = col_names_old
                    .slice(col_index_min, col_index_max + 1)
                    .map(x => x + "_q");
                for (const _name of col_names_new) {
                    tdigests.push(new tdigest.TDigest());
                }

                fs.writeFileSync(output_fname, col_names_old.join(",") + "," + col_names_new.join(",") + "\n");
            } else {
                // parse data
                const vals_split = line
                    .split(",");

                // slice to required columns
                const vals = vals_split
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
                if (new_vals.length == 0) { return; }

                // output to file
                new_vals = new_vals.map(x => x.toFixed(dec_places));
                fs.appendFileSync(output_fname, vals_split.join(",") + "," + new_vals.join(",") + "\n");
            }
            if (line_counter % 10000 == 0) {
                console.log("Processed:", line_counter);
            }
        }

        const lr = new lbl(input_fname);
        lr.on("error", reject);
        lr.on("line", line_handler);
        lr.on("end", () => {
            resolve(line_counter - min_examples_for_digest);
        });
    });
}
