import { Point, parallelWithinEpsilon, dot } from "./point";

export enum VertexId { Corner, VertexA, otherCorner, VertexB }


export class Parallelogram {
    isSeg: Boolean
    corner: Point
    a: Point //a side adjacent to the corner
    b: Point //another side exiting from the corner
    otherCorner: Point
    aPlusCorner: Point
    bPlusCorner: Point
    aRot: Point //a rotated on 90 degrees towards side1
    bRot: Point //b rotated on 90 degrees towards coeff
    abRot: number //a*bRot 
    baRot: number //b*aRot;


    constructor() { }

    // Return true if the parallelogram contains the point
    contains(point: Point): Boolean {
        let g = point.minus(this.corner)
        let e = Point.distanceEpsilon

        let gbRot = g.dot(this.bRot)
        if (gbRot > this.abRot + e || gbRot < -e)
            return false;

        let gaRot = g.dot(this.aRot)
        return gaRot <= this.baRot + e && gaRot >= -e;
    }

    /// Return the correspoinding vertex of the parallelogram
    vertex(vertexPar: VertexId): Point {
        switch (vertexPar) {
            case VertexId.Corner: return this.corner;
            case VertexId.VertexA: return this.aPlusCorner;
            case VertexId.otherCorner: return this.otherCorner;
            case VertexId.VertexB: return this.bPlusCorner;
            default:
                throw undefined;
        }
    }

    area() { return Math.abs(this.a.x * this.b.y - this.a.y * this.b.x) }
}


function PumpMinMax(minx: number, maxx: number, miny: number, maxy: number,
    p: Point) {
    if (p.x < minx) {
        minx = p.x;
    } else if (p.x > maxx) {
        maxx = p.x;
    }
    if (p.y < miny) {
        miny = p.y;
    } else if (p.y > maxy) {
        maxy = p.y;
    }
}

// returns true if parallelograms intersect
export function intersect(parallelogram0: Parallelogram, parallelogram1: Parallelogram) {
    // It can be shown that two parallelograms do not intersect if and only if
    // they are separated with one of the parallelogram sides 


    let ret = !(separByA(parallelogram0, parallelogram1) || separByA(parallelogram1, parallelogram0) ||
        separByB(parallelogram0, parallelogram1) || separByB(parallelogram1, parallelogram0));

    if (ret == false)
        return false;

    if (!(parallelogram0.isSeg && parallelogram1.isSeg))
        return true;


    if (!parallelWithinEpsilon(parallelogram0.otherCorner.minus(parallelogram0.corner),
        parallelogram1.otherCorner.minus(parallelogram1.corner), 1.0E-5))
        return true

    //here we know that the segs are parallel
    return ParallelSegsIntersect(parallelogram1, parallelogram0);

}

function ParallelSegsIntersect(p0: Parallelogram, p1: Parallelogram): Boolean {
    let v0 = p0.corner
    let v1 = p0.otherCorner

    let v2 = p1.corner
    let v3 = p1.otherCorner

    let d = v1.minus(v0)

    //let us imagine that v0 is at zero
    let r0: number = 0; // position of v0
    let r1 = d.dot(d) //offset of v1

    //offset of v2
    let r2 = v2.minus(v0).dot(d)

    //offset of v3
    let r3 = v3.minus(v0).dot(d)

    // we need to check if [r0,r1] intersects [r2,r3]

    if (r2 > r3) {
        let t = r2;
        r2 = r3;
        r3 = t;
    }

    return !(r3 < r0 - Point.distanceEpsilon || r2 > r1 + Point.distanceEpsilon);

}

function separByB(p0: Parallelogram, p1: Parallelogram) {
    let eps = Point.distanceEpsilon
    let p1a = p1.vertex(0).minus(p0.corner).dot(p0.bRot)
    let list = [VertexId.VertexA, VertexId.otherCorner, VertexId.VertexB]
    if (p1a > p0.abRot + eps) {
        for (let i of list) {
            if (p1.vertex(i).minus(p0.corner).dot(p0.bRot) <= p0.abRot + eps)
                return false;
        }

        return true;
    } else if (p1a < -eps) {
        for (let i of list) {
            if (p1.vertex(i).minus(p0.corner).dot(p0.bRot) >= -eps)
                return false;
        }
        return true;
    }
    return false;
}
function separByA(p0: Parallelogram, p1: Parallelogram) {

    let eps = Point.distanceEpsilon;

    let t = p1.corner.minus(p0.corner)
    let p1a = dot(t, p0.aRot);

    if (p1a > p0.baRot + eps) {
        t.x = p1.aPlusCorner.x - p0.corner.x;
        t.y = p1.aPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) <= p0.baRot + eps)
            return false;

        t.x = p1.bPlusCorner.x - p0.corner.x;
        t.y = p1.bPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) <= p0.baRot + eps)
            return false;

        t.x = p1.otherCorner.x - p0.corner.x;
        t.y = p1.otherCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) <= p0.baRot + eps)
            return false;

        return true;
    } else if (p1a < -eps) {
        t.x = p1.aPlusCorner.x - p0.corner.x;
        t.y = p1.aPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) >= - eps)
            return false;

        t.x = p1.bPlusCorner.x - p0.corner.x;
        t.y = p1.bPlusCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) >= -eps)
            return false;

        t.x = p1.otherCorner.x - p0.corner.x;
        t.y = p1.otherCorner.y - p0.corner.y;
        if (dot(t, p0.aRot) >= -eps)
            return false;

        return true;
    }

    return false
}

/// create a Parallelogram over a group
function GetParallelogramOfAGroup(boxes: [Parallelogram]) {
    let minx = 0, maxx = 0, miny = 0, maxy = 0
    let firstTime = true;
    for (let b of boxes) {
        let verts = AllVertices(b)
        for (var v of verts) {
            let x = v.x;
            let y = v.y;
            if (firstTime) {
                firstTime = false;
                minx = maxx = x;
                miny = maxy = y;
            } else {
                if (x < minx) {
                    minx = x;
                } else if (x > maxx) {
                    maxx = x;
                }
                if (y < miny) {
                    miny = y;
                } else if (y > maxy) {
                    maxy = y;
                }
            }
        }
    }
    return parallelogramByCornerSideSide(new Point(minx, miny),
        new Point(0, maxy - miny),
        new Point(maxx - minx, 0));
}


export function parallelogramByCornerSideSide(corner: Point, sideA: Point, sideB: Point): Parallelogram {
    const result = new Parallelogram();

    result.corner = corner;
    result.a = sideA;
    result.b = sideB;

    result.aRot = new Point(-sideA.y, sideA.x);
    if (result.aRot.length() > 0.5)
        result.aRot = result.aRot.normalize();

    result.bRot = new Point(-sideB.y, sideB.x);
    if (result.bRot.length() > 0.5)
        result.bRot = result.bRot.normalize();

    result.abRot = result.bRot.dot(sideA)

    result.baRot = sideB.dot(result.aRot)

    if (result.abRot < 0) {
        result.abRot = -result.abRot;
        result.bRot = result.bRot.neg();
    }

    if (result.baRot < 0) {
        result.baRot = -result.baRot
        result.aRot = result.aRot.neg()
    }

    result.isSeg = sideA.minus(sideB).length() < Point.distanceEpsilon;

    result.aPlusCorner = sideA.add(corner);
    result.otherCorner = sideB.add(result.aPlusCorner);
    result.bPlusCorner = sideB.add(corner);

    return result;
}

export function parallelogramOfTwo(box0: Parallelogram, box1: Parallelogram): Parallelogram {
    let result = new Parallelogram();
    let v = box0.corner
    let minx = v.x, maxx = v.x, miny = v.y, maxy = v.y


    PumpMinMax(minx, maxx, miny, maxy, box0.aPlusCorner);
    PumpMinMax(minx, maxx, miny, maxy, box0.otherCorner);
    PumpMinMax(minx, maxx, miny, maxy, box0.bPlusCorner);

    PumpMinMax(minx, maxx, miny, maxy, box1.corner);
    PumpMinMax(minx, maxx, miny, maxy, box1.aPlusCorner);
    PumpMinMax(minx, maxx, miny, maxy, box1.otherCorner);
    PumpMinMax(minx, maxx, miny, maxy, box1.bPlusCorner);

    result.corner = new Point(minx, miny);
    result.a = new Point(0, maxy - miny);
    result.b = new Point(maxx - minx, 0);

    result.aPlusCorner = result.a.add(result.corner);
    result.otherCorner = result.b.add(result.aPlusCorner);
    result.bPlusCorner = result.b.add(result.corner);

    result.aRot = new Point(-result.a.y, result.a.x);
    if (result.aRot.length() > 0.5)
        result.aRot = result.aRot.normalize();

    result.bRot = new Point(-result.b.y, result.b.x);
    if (result.bRot.length() > 0.5)
        result.bRot = result.bRot.normalize()

    result.abRot = result.a.dot(result.bRot)
    result.baRot = result.b.dot(result.aRot)


    if (result.abRot < 0) {
        result.abRot = -result.abRot;
        result.bRot = result.bRot.neg();
    }

    if (result.baRot < 0) {
        result.baRot = -result.baRot;
        result.aRot = result.aRot.neg();
    }

    result.isSeg = result.a.minus(result.b).length() < Point.distanceEpsilon
    return result
}

function* AllVertices(p: Parallelogram) {
    yield p.corner
    yield p.aPlusCorner
    yield p.otherCorner
    yield p.bPlusCorner
}
function* OtherVertices(p: Parallelogram) {
    yield p.aPlusCorner
    yield p.otherCorner
    yield p.bPlusCorner
}
