import { LinearSystem2 } from './linearSystem'
export class Point {
    static distanceEpsilon = Math.pow(10, -6)
    static tolerance = 1.0E-8;

    x: number
    y: number

    dot(a: Point): number { return dot(this, a) }

    static close(a: Point, b: Point, tol: number): Boolean {
        return a.minus(b).length() <= tol;
    }
    static closeD(a: number, b: number): Boolean {
        let d = a - b;
        return - Point.distanceEpsilon <= d && Point.distanceEpsilon >= d;
    }
    normalize() {
        let l = this.length();
        return new Point(this.x / l, this.y / l);
    }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y) }
    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    move(a: Point): void {
        this.x += a.x;
        this.y += a.y;
    }

    scale(sx: number, sy: number): Point {
        return new Point(this.x * sx, this.y * sy);
    }

    add(a: Point): Point {
        return new Point(this.x + a.x, this.y + a.y)
    }
    minus(a: Point) {
        return new Point(this.x - a.x, this.y - a.y)
    }
    mult(c: number) {
        return new Point(this.x * c, this.y * c)
    }
    div(c: number) {
        return new Point(this.x / c, this.y / c)
    }
    equal(a: Point) { return a.x == this.x && a.y == this.y }
    neg() { return new Point(-this.x, -this.y) }
    static lineLineIntersection(a: Point, b: Point, c: Point, d: Point): { x?: Point } {
        //look for the solution in the form a+u*(b-a)=c+v*(d-c)
        let ba = b.minus(a);
        let cd = c.minus(d);
        let ca = c.minus(a);
        let eps = Point.tolerance;
        let ret = LinearSystem2.Solve(ba.x, cd.x, ca.x, ba.y, cd.y, ca.y);
        if (ret.x && ret.x > -eps && ret.x < 1.0 + eps && ret.y > -eps && ret.y < 1.0 + eps) {
            return { x: a.add(ba.mult(ret.x)) };
        }
        else {
            return {}
        }
    }

    static parallelWithinEpsilon(a: Point, b: Point, eps: number) {
        let alength = a.length();
        let blength = b.length();
        if (alength < eps || blength < eps)
            return true;

        a = a.div(alength);
        b = b.div(blength);

        return Math.abs(-a.x * b.y + a.y * b.x) < eps;
    }
    static crossProduct(point0: Point, point1: Point) {
        return point0.x * point1.y - point0.y * point1.x;
    }
}
export function dot(a: Point, b: Point) { return a.x * b.x + a.y * b.y }
export function add(a: Point, b: Point) { return a.add(b) }


