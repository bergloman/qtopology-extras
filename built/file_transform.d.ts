/**
 * This method will transform given input file
 * and write the result to output file.
 */
export declare function transformFile(input_fname: string, output_fname: string, line_handler: (s: string) => string): Promise<{}>;
