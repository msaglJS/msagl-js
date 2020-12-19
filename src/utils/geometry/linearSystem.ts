
// solves a linear system of two equations with to unknown variables
export class LinearSystem2 {
    LinearSystem2() { }
    static eps = 1.0E-8;


    static Solve(a00: number, a01: number, b0: number, a10: number, a11: number, b1: number): { x?: number, y?: number } {
        let d = a00 * a11 - a10 * a01;

        if (Math.abs(d) < LinearSystem2.eps) {
            return {}
        }

        return {
            x: (b0 * a11 - b1 * a01) / d, y: (a00 * b1 - a10 * b0) / d
        }

    }
}

