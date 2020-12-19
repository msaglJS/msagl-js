import { ICurve } from './icurve'
import { Point } from './point'
import { parallelogramByCornerSideSide } from './parallelogram'
import { PlaneTransformation } from './planeTransformation'
import { Rectangle } from './rectangle'
export class LineSegment implements ICurve {

    a: Point;//the line goes from a to b
    b: Point;  // the line end point
    // Offsets the curve in the direction of dir
    OffsetCurve(offset: number, dir: Point) { return null; }
    // the line start point
    Start() { return this.a; }
    End() { return this.b; }


    // the start parameter
    ParStart() { return 0; }

    // the end parameter
    ParEnd() { return 1; }

    constructor(x: number, y: number, x1: number, y1: number) {
        this.a = new Point(x, y);
        this.b = new Point(x1, y1);
    }

    // Returns the trim curve
    Trim(start: number, end: number): ICurve {
        start = Math.max(this.ParStart(), start);
        end = Math.min(this.ParEnd(), end);
        if (start > end)
            throw "wrong params in trimming";

        let p1 = this.value(start);
        let p2 = this.value(end);
        if (Point.close(p1, p2, Point.distanceEpsilon)) {
            return null;
        }
        return LineSegment.lineSegmentPointPoint(p1, p2);
    }

    value(t: number) { return this.a.add(this.b.minus(this.a).mult(t)); }
    // Not Implemented: Returns the trimmed curve, wrapping around the end if start is greater than end.
    TrimWithWrap(start: number, end: number) { return null; } // not implemented

    // A tree of ParallelogramNodes covering the curve. 
    // This tree is used in curve intersections routines.
    // <value></value>
    ParallelogramNodeOverICurve() {
        let side = this.b.minus(this.a).mult(0.5);
        return {
            parallelogram: parallelogramByCornerSideSide(this.a, side, side),
            seg: this.Clone(),
            leafBoxesOffset: 0,
            node: {
                low: 0,
                high: 1,
                chord: this.Clone()
            }
        }
    }

    Normal() {
        let t = this.a.minus(this.b);
        t = t.div(t.length());
        return new Point(-t.y, t.x);
    }

    // construct a line segment
    static lineSegmentPointPoint(start: Point, end: Point) {
        return new LineSegment(start.x, start.y, end.x, end.y);
    }

    // constructs a line segment
    static lineSegmentPointCoordCoord(p: Point, x: number, y: number) {
        return new LineSegment(p.x, p.y, x, y);
    }

    Derivative(t: number) { return this.b.minus(this.a); }

    SecondDerivative(t: number) {
        return new Point(0, 0);
    }

    ThirdDerivative(t: number) {
        return new Point(0, 0);
    }

    Reverse() {
        return LineSegment.lineSegmentPointPoint(this.b, this.a);
    }

    /*      
            static internal IntersectionInfo Cross(LineSeg coeff, LineSeg side1){
            IntersectionInfo xx=CrossTwoLines(coeff.Start, coeff.End-coeff.Start,side1.Start, side1.End-side1.Start);
            if (xx == null)
            {
            //parallel segs
            Point adir=coeff.d1(0);
            Point bdir=side1.d1(0);

            if (adir.Length > bdir.Length)
            {
            if (adir.Length > Curve.DistEps)
            {
            adir = adir.Normalize();
            if(Math.Abs((coeff-side1)*adir<Curve.DistEps)){

            }
            }
            }
            return null;
            }

            if(xx.Par0>1){
            if (ApproximateComparer.Close(coeff.End, xx.X))
            {
            xx.X = coeff.End;
            xx.Par0 = 1;
            }
            else
            return null;
            }
            else if(xx.Par0<0){
            if(ApproximateComparer.Close(coeff.Start,xx.X)){
            xx.X=coeff.Start; 
            xx.Par0=1;
            }
            else
            return null;
            }

            if (xx.Par1 > 1)
            {
            if (ApproximateComparer.Close(side1.End, xx.X))
            {
            xx.X = coeff.End;
            xx.Par1 = 1;
            }
            else
            return null;
            }
            else if (xx.Par1 < 0)
            {
            if (ApproximateComparer.Close(side1.Start, xx.X))
            {
            xx.X = coeff.Start;
            xx.Par1 = 1;
            }
            else
            return null;
            }

            return xx;
            }
            * */

    // Returns the curved moved by delta
    Translate(delta: Point) {
        this.a.move(delta);
        this.b.move(delta);
    }

    // Scale (multiply) from origin by x and y
    ScaleFromOrigin(xScale: number, yScale: number) {
        return LineSegment.lineSegmentPointPoint(this.a.scale(xScale, yScale), this.b.scale(xScale, yScale));
    }

    // gets the parameter at a specific length from the start along the curve
    GetParameterAtLength(length: number): number {
        var len = (this.b.minus(this.a)).length();
        if (len < Point.tolerance)
            return 0;
        var t = length / len;
        return t > 1 ? 1 : (t < 0 ? 0 : t);
    }

    // Return the transformed curve
    Transform(transformation: PlaneTransformation) {
        return LineSegment.lineSegmentPointPoint(transformation.MultiplyPoint(this.a), transformation.MultiplyPoint(this.b));
    }

    // returns a parameter t such that the distance between curve[t] and targetPoint is minimal 
    // and t belongs to the closed segment [low,high]
    ClosestParameterWithinBounds(targetPoint: Point, low: number, high: number) {
        var t = this.ClosestParameter(targetPoint);
        if (t < low)
            t = low;
        if (t > high)
            t = high;
        return t;
    }

    // return length of the curve segment [start,end] 
    LengthPartial(start: number, end: number) {
        return this.value(end).minus(this.value(start)).length();
    }

    // Get the length of the curve
    Length() {
        return this.a.minus(this.b).length();
    }
    // The bounding box of the line
    BoundingBox() {
        return Rectangle.rectanglePointPoint(this.a, this.b);
    }




    // clones the curve. 

    Clone() {
        return LineSegment.lineSegmentPointPoint(this.a, this.b);
    }

    static closestParameterOnLineSegment(point: Point, segmentStart: Point, segmentEnd: Point) {
        let bc = segmentEnd.minus(segmentStart);
        let ba = point.minus(segmentStart);
        let c1 = bc.dot(ba);
        if (c1 <= 0.0 + Point.tolerance)
            return 0;

        let c2 = bc.dot(bc);
        if (c2 <= c1 + Point.tolerance)
            return 1;

        return c1 / c2;
    }

    // returns a parameter t such that the distance between curve[t] and a is minimal
    ClosestParameter(targetPoint: Point) {
        return LineSegment.closestParameterOnLineSegment(targetPoint, this.a, this.b);
    }
    // left derivative at t
    LeftDerivative(t: number) {
        return this.Derivative(t);
    }

    // right derivative at t
    RightDerivative(t: number) {
        return this.Derivative(t);
    }
    // returns true if segments are not parallel and are intesecting
    static IntersectPPPP(a: Point, b: Point, c: Point, d: Point): { x?: Point } {
        let r = Point.lineLineIntersection(a, b, c, d);
        if (r.x == undefined)
            return {};
        if (LineSegment.XIsBetweenPoints(a, b, r.x) && LineSegment.XIsBetweenPoints(c, d, r.x))
            return r;
        else return {};
    }

    static XIsBetweenPoints(a: Point, b: Point, x: Point): Boolean {
        return a.minus(x).dot(b.minus(x)) <= Point.distanceEpsilon;
    }

    // 
    Curvature(_: number) { return 0; }
    // 
    CurvatureDerivative(_: number) { return 0; }


    CurvatureSecondDerivative(_: number) { return 0; }

    // [a,b] and [c,d] are the segments. u and v are the corresponding closest point params
    // see http://www.geometrictools.com/Documentation/DistanceLine3Line3.pdf
    static MinDistBetweenLineSegments(a: Point, b: Point, c: Point, d: Point): { dist: number, parab: number, parcd: number } {
        let u = b.minus(a);
        let v = d.minus(c);
        let w = a.minus(c);

        let D = Point.crossProduct(u, v);

        let uu = u.dot(u);        // always >= 0
        let uv = u.dot(v);
        let vv = v.dot(v);        // always >= 0
        let uw = u.dot(w);
        let vw = v.dot(w);
        var sN: number, tN: number;
        let absD = Math.abs(D);
        let sD = absD, tD = absD;

        // compute the line parameters of the two closest points
        if (absD < Point.tolerance) { // the lines are almost parallel
            sN = 0.0;        // force using point a on segment [a..b]
            sD = 1.0;        // to prevent possible division by 0.0 later
            tN = vw;
            tD = vv;
        }
        else {                // get the closest points on the infinite lines
            sN = Point.crossProduct(v, w);
            tN = Point.crossProduct(u, w);
            if (D < 0) {
                sN = -sN;
                tN = -tN;
            }

            if (sN < 0.0) {       // parab < 0 => the s=0 edge is visible
                sN = 0.0;
                tN = vw;
                tD = vv;
            }
            else if (sN > sD) {  // parab > 1 => the s=1 edge is visible
                sN = sD = 1;
                tN = vw + uv;
                tD = vv;
            }
        }

        if (tN < 0.0) {           // tc < 0 => the t=0 edge is visible
            tN = 0.0;
            // recompute parab for this edge
            if (-uw < 0.0)
                sN = 0.0;
            else if (-uw > uu)
                sN = sD;
            else {
                sN = -uw;
                sD = uu;
            }
        }
        else if (tN > tD) {      // tc > 1 => the t=1 edge is visible
            tN = tD = 1;
            // recompute parab for this edge
            if ((-uw + uv) < 0.0)
                sN = 0;
            else if ((-uw + uv) > uu)
                sN = sD;
            else {
                sN = (-uw + uv);
                sD = uu;
            }
        }

        let parab_ = Math.abs(sN) < Point.tolerance ? 0.0 : sN / sD;
        let parcd_ = Math.abs(tN) < Point.tolerance ? 0.0 : tN / tD;
        // finally do the division to get parameters
        return {
            parab: parab_,
            parcd: parcd_,
            // get the difference of the two closest points
            //            let dP = w + (parab * u) - (parcd * v),

            dist: w.add(u.mult(parab_).minus(v.mult(parcd_))).length()   // return the closest distance
        };
    }
}


