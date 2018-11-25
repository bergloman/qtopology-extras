import * as fs from "fs";
import * as lbl from "line-by-line";

export interface ISplitFilesParams {
    train_size: number;
    validation_size: number;
    input_fname: string;
    train_fname: string;
    validation_fname: string;
    test_fname: string;
}

/** Split given file into train-validation-test files */
export function split_files(options: ISplitFilesParams) {
    return new Promise((resolve, reject) => {
        const { train_size, validation_size, input_fname, train_fname, validation_fname, test_fname } = options;
        let line_counter = 0;
        let header = null;

        function line_handler(line) {
            if (line_counter <= train_size) {
                if (line_counter == 0) {
                    console.log("Writing train file...");
                    header = line;
                    fs.writeFileSync(train_fname, header + "\n");
                } else {
                    fs.appendFileSync(train_fname, line + "\n");
                }
            } else if (line_counter <= train_size + validation_size) {
                if (line_counter == train_size + 1) {
                    console.log("Writing validation file...");
                    header = line;
                    fs.writeFileSync(validation_fname, header + "\n");
                }
                fs.appendFileSync(validation_fname, line + "\n");
            } else {
                if (line_counter == train_size + validation_size + 1) {
                    console.log("Writing test file...");
                    header = line;
                    fs.writeFileSync(test_fname, header + "\n");
                }
                fs.appendFileSync(test_fname, line + "\n");
            }
            line_counter++;
        }

        const lr = new lbl(input_fname);
        lr.on("error", reject);
        lr.on("line", line_handler);
        lr.on("end", resolve);
    });
}
