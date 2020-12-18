// eslint-disable-next-line import/no-unresolved
import { Point } from './utils/geometry/point';
import { VertexId, intersect, parallelogramByCornerSideSide, parallelogramOfTwo } from "./utils/geometry/parallelogram";

test("point test", () => {
    const a: number = 1;
    const b: number = 2;
    const c: number = 3.1;
    const d: number = 5.9;

    const p1: Point = new Point(a, b);
    const p2: Point = new Point(c, d);

    console.log(p1.length());
    expect(p1.length()).toBe(Math.sqrt(a * a + b * b))

    var resultPoint = p1.add(p2);
    expect(resultPoint.x).toBe(a + c);
    expect(resultPoint.y).toBe(b + d);

    resultPoint = p1.minus(p2);
    expect(resultPoint.x).toBe(a - c);
    expect(resultPoint.y).toBe(b - d);

    resultPoint = p1.mult(2);
    expect(resultPoint.x).toBe(a * 2);
    expect(resultPoint.y).toBe(b * 2);
});

test("parallelogram intersect test", () => {

    let pr0 = parallelogramByCornerSideSide(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    expect(pr0.corner.equal(new Point(0, 0))).toBe(true);
    expect(pr0.vertex(0).equal(pr0.corner)).toBe(true);

    let pr1 = parallelogramByCornerSideSide(new Point(2, 0), new Point(1, 0), new Point(0, 1));
    expect(intersect(pr0, pr1)).toBe(false);
    let pr2 = parallelogramByCornerSideSide(new Point(0, 0), new Point(2, 0), new Point(0, 1));
    expect(intersect(pr0, pr2)).toBe(true);
    let pr3 = parallelogramByCornerSideSide(new Point(0, 0), new Point(2.0 - 0.00001, 0), new Point(0, 1));
    expect(intersect(pr1, pr3)).toBe(false);
});

test("parallelogram contains test", () => {
    let par = parallelogramByCornerSideSide(new Point(0, 0), new Point(1, 0), new Point(0, 1));
    let pOut = par.vertex(VertexId.otherCorner).mult(1.1);
    expect(par.contains(pOut)).toBe(false);

    let par0 = parallelogramByCornerSideSide(new Point(1, 0), new Point(2, 1), new Point(0, 1));
    let pIn = par0.vertex(VertexId.otherCorner).add(par0.vertex(VertexId.Corner)).div(2);
    expect(par0.contains(pIn)).toBe(true);

    let parTwo = parallelogramOfTwo(par, par0);
    for (var i of [0, 1, 2, 3]) {
        expect(parTwo.contains(par.vertex(i))).toBe(true);
        expect(parTwo.contains(par0.vertex(i))).toBe(true);
    }
});
test("parallelogram seg case", () => {
    let par = parallelogramByCornerSideSide(new Point(0, 0), new Point(1, 0), new Point(1, Point.distanceEpsilon));
    let par0 = parallelogramByCornerSideSide(new Point(0.5, 0), new Point(2, 1), new Point(2, 1));
    let par1 = parallelogramByCornerSideSide(new Point(0.5, 0.1), new Point(2, 1), new Point(2, 1));
    let par2 = parallelogramByCornerSideSide(new Point(0.5, -0.1), new Point(2, 1), new Point(2, 1));
    let par3 = parallelogramByCornerSideSide(new Point(0.5, -0.1 - Point.distanceEpsilon / 2), new Point(2, 1), new Point(2, 1));
    expect(intersect(par, par0)).toBe(true);
    expect(intersect(par, par1)).toBe(false);
    expect(intersect(par, par2)).toBe(true);
    expect(intersect(par2, par3)).toBe(true);
});



