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
export declare function quantilizeCsvFile(options: IQuantilizeCsvFileParams): Promise<{}>;
