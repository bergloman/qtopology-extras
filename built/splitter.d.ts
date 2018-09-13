export interface ISplitFilesParams {
    train_size: number;
    validation_size: number;
    input_fname: string;
    train_fname: string;
    validation_fname: string;
    test_fname: string;
}
/** Split given file into train-validation-test files */
export declare function split_files(options: ISplitFilesParams): Promise<{}>;
