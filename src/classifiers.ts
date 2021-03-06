import {
    LearningExample, SparseVec,
    ISparseVecClassiffier, ISparseVecClassiffierBuilder,
    IRegressionBuilder, IRegression, LearningExampleDense
} from "./data_objects";

import * as qm from "qminer";

const analytics = qm.analytics;
const la = qm.la;

/**
 * Sparse-vector classifier that uses SVM algorithm
 */
export class SparseVecClassifierSVC implements ISparseVecClassiffierBuilder {

    public build(data: LearningExample[]): ISparseVecClassiffier {
        const mat = new la.SparseMatrix(data.map(x => x.val1));
        const vec = new la.Vector(data.map(x => x.val2));
        const svc = new analytics.SVC();
        svc.fit(mat, vec);
        const res: ISparseVecClassiffier = {
            classify: (v: SparseVec): number => {
                const sparse_v = new la.SparseVector(v);
                return svc.predict(sparse_v);
            },
            decisionFunction: (v: SparseVec): number => {
                const sparse_v = new la.SparseVector(v);
                return svc.decisionFunction(sparse_v);
            }
        };
        return res;
    }
}

// export class SparseVecClassifierNN implements ISparseVecClassiffierBuilder {

//     public build(data: LearningExample[]): ISparseVecClassiffier {

//         const analytics = qm.analytics;
//         const la = qm.la;

//         const mat = new la.SparseMatrix(data.map(x => x.val1));
//         const vec = new la.Vector(data.map(x => x.val2));

//         const svc = new analytics.SVC();
//         svc.fit(mat, vec);

//         return {
//             classify: (v: SparseVec): number => {
//                 const sparse_v = new la.SparseVector(v);
//                 return svc.predict(sparse_v);
//             }
//         };
//     }
// }

/**
 * Regression builder that uses ridge-regression internally
 */
export class RidgeRegression implements IRegressionBuilder {

    public build(data: LearningExampleDense[]): IRegression {
        const A = new la.Matrix(data.map(x => x.val1)).transpose();
        const b = new la.Vector(data.map(x => x.val2));
        const regmod = new analytics.RidgeReg({ gamma: 1.0 });
        regmod.fit(A, b);
        const res: IRegression = {
            predict: (input: number[]): number => {
                const v = new la.Vector(input);
                return regmod.predict(v);
            }
        };
        return res;
    }
}
