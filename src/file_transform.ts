import * as fs from "fs";
import * as lbl from "line-by-line";

/**
 * This method will transform given input file
 * and write the result to output file.
 */
export function transformFile(input_fname: string, output_fname: string, line_handler: (s: string) => string) {
    return new Promise((resolve, reject) => {
        let lr = new lbl(input_fname);
        let buffer = [];
        lr.on('error', reject);
        lr.on('line', (s: string) => {
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
