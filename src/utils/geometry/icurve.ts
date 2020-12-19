import { PlaneTransformation } from "./planeTransformation";
import { Point } from "./point"
import { PN } from "./parallelogramNode"
import { Rectangle } from "./rectangle"
/// The interface for curves: instances of ICurve inside of GLEE
/// are BSpline,Curve,LineSeg, Ellipse,CubicBezierSeg and ArrowTipCurve.
export interface ICurve {
    /// Returns the point on the curve corresponding to parameter t
    value(t: number): Point;
    /// first derivative at t
    Derivative(t: number): Point;
    /// second derivative
    SecondDerivative(t: number): Point;
    /// third derivative
    ThirdDerivative(t: number): Point;

    /// A tree of ParallelogramNodes covering the curve. 
    /// This tree is used in curve intersections routines.
    ParallelogramNodeOverICurve(): PN;

    /// XY bounding box of the curve
    BoundingBox(): Rectangle;

    /// the start of the parameter domain
    ParStart(): number;

    /// the end of the parameter domain
    ParEnd(): number;

    /// Returns the trim curve between start and end, without wrap
    Trim(start: number, end: number): ICurve;

    /// Returns the trim curve between start and end, with wrap, if supported by the implementing class.
    TrimWithWrap(start: number, end: number): ICurve;

    /// Moves the curve by the delta.
    Translate(delta: Point): void;

    /// Returns the curved with all points scaled from the original by x and y
    ScaleFromOrigin(xScale: number, yScale: number): ICurve;

    /// this[ParStart]
    Start(): Point;

    /// this[ParEnd]
    End(): Point;

    /// this[Reverse[t]]=this[ParEnd+ParStart-t]
    Reverse(): ICurve;

    /// Offsets the curve in the direction of dir
    OffsetCurve(offset: number, dir: Point): ICurve;

    /// return length of the curve segment [start,end] 
    LengthPartial(start: number, end: number): number;

    /// Get the length of the curve
    Length(): number;



    GetParameterAtLength(length: number): number;

    /// Return the transformed curve
    Transform(transformation: PlaneTransformation): ICurve;


    /// and t belongs to the closed segment [low,high]
    ClosestParameterWithinBounds(targetPoint: Point, low: number, high: number): number;

    ClosestParameter(targetPoint: Point): number;
    /// clones the curve. 
    Clone(): ICurve;

    /// The left derivative at t. 
    LeftDerivative(t: number): Point;


    /// the right derivative at t
    RightDerivative(t: number): Point;


    /// the signed curvature of the segment at t
    Curvature(t: number): number;
    /// the derivative of the curvature at t
    CurvatureDerivative(t: number): number;


    /// the derivative of CurvatureDerivative
    CurvatureSecondDerivative(t: number): number;
}
