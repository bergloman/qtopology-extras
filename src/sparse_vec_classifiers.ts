import {
    LearningExample, SparseVec,
    ISparseVecClassiffier, ISparseVecClassiffierBuilder
} from "./data_objects";

import * as qm from "qminer";

export class SparseVecClassifierSVC implements ISparseVecClassiffierBuilder {

    public build(data: LearningExample[]): ISparseVecClassiffier {

        const analytics = qm.analytics;
        const la = qm.la;

        const mat = new la.SparseMatrix(data.map(x => x.val1));
        const vec = new la.Vector(data.map(x => x.val2));

        const svc = new analytics.SVC();
        svc.fit(mat, vec);

        return {
            classify: (v: SparseVec): number => {
                const sparse_v = new la.SparseVector(v);
                return svc.predict(sparse_v);
            }
        };
    }
}
