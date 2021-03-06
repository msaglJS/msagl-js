// using System.Collections.Generic;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;
// using Microsoft.Msagl.Core;

// namespace Microsoft.Msagl.Routing.Visibility {
//     internal class ActiveDiagonalComparerWithRay: IComparer < Diagonal > {

//         Point pointOnTheRay;

//         [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//           internal Point PointOnTangentAndInsertedDiagonal {
//         get { return pointOnTheRay; }
//         set { pointOnTheRay = value; }
//     }

//           public int Compare(Diagonal x, Diagonal y) {
//         ValidateArg.IsNotNull(x, "x");
//         ValidateArg.IsNotNull(y, "y");
//         Assert.assert(BelongsToTheDiagonal(PointOnTangentAndInsertedDiagonal, x.start, x.End));
//         if (x.start != y.start)
//             switch (Point.getTriangleOrientation(PointOnTangentAndInsertedDiagonal, y.start, y.End)) {
//                 case TriangleOrientation.Counterclockwise:
//                     return -1;
//                 default:
//                     return 1;
//             } else {
//             return 0;
//         }
//     }

//     [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//           static bool BelongsToTheDiagonal(Point IntersectionOfTheRayAndInsertedEdge, Point start, Point end) {
//         return Point.closeDistEps(IntersectionOfTheRayAndInsertedEdge, Point.ClosestPointAtLineSegment(IntersectionOfTheRayAndInsertedEdge, start, end));
//     }

//     [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//           static internal Point IntersectDiagonalWithRay(Point pivot, Point pointOnRay, Diagonal diagonal) {
//         Point ray = pointOnRay - pivot;
//         Point source = diagonal.start;
//         Point target = diagonal.End;
//         //let x(t-s)+s is on the ray, then for some y we x(t-s)+s=y*ray+pivot, or x(t-s)-y*ray=pivot-s
//         double x, y;
//         bool result = LinearSystem2.Solve(target.x - source.x, -ray.x, pivot.x - source.x, target.y - source.y, -ray.y, pivot.y - source.y, out x, out y);

//         Assert.assert(result && -ApproximateComparer.Tolerance <= x && x <= 1 + ApproximateComparer.Tolerance);

//         return pivot + y * ray;
//     }

// }
// }
