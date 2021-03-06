// // following "Visibility Algorithms in the Plane", Ghosh
// internal class PointVisibilityCalculator {
//   activeEdgeComparer: ActiveEdgeComparerWithRay;

//   RBTree<PolylinePoint> activeSidesTree;

//   // A mapping from sides to their RBNodes
//   Dictionary<PolylinePoint, RBNode<PolylinePoint>> sideNodes = new Dictionary<PolylinePoint, RBNode<PolylinePoint>>();

//         readonly BinaryHeapWithComparer < Stem > heapForSorting;

//         readonly VisibilityGraph visibilityGraph;
//         readonly VisibilityKind visibilityKind;

//         // These are parts of hole boundaries visible from q where each node is taken in isolation
//         readonly Dictionary < Polyline, Stem > visibleBoundaries = new Dictionary<Polyline, Stem>();

// Point q;
//         readonly PolylinePoint qPolylinePoint;

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// internal VisibilityVertex QVertex { get; set; }

//         readonly List < PolylinePoint > sortedListOfPolypoints = new List<PolylinePoint>();
//                                      //the sorted list of possibly visible vertices

//         readonly IEnumerable < Polyline > holes;

// // We suppose that the holes are convex and oriented clockwis and are mutually disjoint
// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// internal static void CalculatePointVisibilityGraph(IEnumerable < Polyline > listOfHoles,
//   VisibilityGraph visibilityGraph, Point point,
//   VisibilityKind visibilityKind, out VisibilityVertex qVertex) {
//   //maybe there is nothing to do
//   var qv = visibilityGraph.FindVertex(point);
//   if (qv != null) {
//     qVertex = qv;
//     return;
//   }

//   var calculator = new PointVisibilityCalculator(listOfHoles, visibilityGraph, point, visibilityKind);
//   calculator.FillGraph();
//   qVertex = calculator.QVertex;
//   Assert.assert(qVertex != null);
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void FillGraph() {
//   ComputeHoleBoundariesPossiblyVisibleFromQ();
//   if (visibleBoundaries.Count > 0) {
//     SortSAndInitActiveSides();
//     // CheckActiveSidesAreConsistent();
//     Sweep();
//   }
// }

// // sorts the set of potentially visible vertices around point q
// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void SortSAndInitActiveSides() {
//   InitHeapAndInsertActiveSides();
//   for (Stem stem = heapForSorting.GetMinimum();; stem = heapForSorting.GetMinimum()) {
//     sortedListOfPolypoints.Add(stem.start);
//     if (stem.MoveStartClockwise())
//       heapForSorting.ChangeMinimum(stem);
//     else
//       heapForSorting.Dequeue();
//     if (heapForSorting.Count == 0)
//       break;
//   }
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void InitHeapAndInsertActiveSides() {
//   foreach(Stem pp of GetInitialVisibleBoundaryStemsAndInsertActiveSides())
//   heapForSorting.Enqueue(pp);
// }

// // these are chuncks of the visible boundaries growing from the polyline  point just above its crossing with the horizontal ray or
// // from the visible part start
// // In the general case we have two stems from one polyline
// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// IEnumerable < Stem > GetInitialVisibleBoundaryStemsAndInsertActiveSides() {
//   foreach(var keyValuePair of visibleBoundaries) {
//     Polyline hole = keyValuePair.Key;
//     Stem stem = keyValuePair.Value;
//     bool crosses = false;

//     foreach(PolylinePoint side of stem.Sides) {
//       PolylinePoint source = side;
//       if (source.point.y < q.y) {
//         if (side.NextOnPolyline.point.y >= q.y) {
//           TriangleOrientation orientation = Point.getTriangleOrientation(q, source.point,
//             side.NextOnPolyline.point);
//           if (orientation == TriangleOrientation.Counterclockwise ||
//             orientation == TriangleOrientation.Collinear) {
//             crosses = true;
//             //we have two stems here
//             yield return new Stem(stem.start, side);
//             yield return new Stem(side.NextOnPolyline, stem.End);

//             RegisterActiveSide(side);
//             break;
//           }
//         }
//       } else if (source.point.y > q.y)
//         break;
//       else if (side.point.x >= q.x) {
//         //we have pp.y==q.y
//         crosses = true;
//         //we need to add one or two stems here
//         yield return new Stem(side, stem.End);
//         if (side != stem.start)
//           yield return new Stem(stem.start, hole.Prev(source));

//         RegisterActiveSide(side);
//         break;
//       }
//     }
//     //there is no intersection with the ray
//     if (!crosses)
//       yield return stem;
//   }
// }

// void RegisterActiveSide(PolylinePoint side)
// {
//   activeEdgeComparer.IntersectionOfTheRayAndInsertedEdge = activeEdgeComparer.IntersectEdgeWithRay(side, new Point(1, 0));
//   sideNodes[side] = activeSidesTree.Insert(side);
// }

// //private Polyline GetPolylineBetweenPolyPointsTest(Polyline hole, PolylinePoint p0, PolylinePoint p1) {
// //    Polyline ret = new Polyline();
// //    while (p0 != p1) {
// //        ret.AddPoint(p0.point);
// //        p0 = hole.next(p0);
// //    }

// //    ret.AddPoint(p1.point);
// //    return ret;
// //}

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// PointVisibilityCalculator(IEnumerable < Polyline > holes, VisibilityGraph visibilityGraph, Point point,
//   VisibilityKind visibilityKind) {
//   this.holes = holes;
//   //this.graphOfHoleBoundaries = holeBoundariesGraph;
//   this.visibilityGraph = visibilityGraph;
//   q = point;
//   qPolylinePoint = new PolylinePoint(q);
//   QVertex = this.visibilityGraph.AddVertex(qPolylinePoint);
//   this.visibilityKind = visibilityKind;
//   heapForSorting = new BinaryHeapWithComparer<Stem>(new StemStartPointComparer(q));
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void Sweep() {
//   foreach(PolylinePoint polylinePoint of sortedListOfPolypoints)
//   SweepPolylinePoint(polylinePoint);
// #if TEST_MSAGL
//             //List<ICurve> l = new List<ICurve>();
//             //foreach (PEdge pe of this.visibilityGraph.Edges) {
//             //    if (!Point.closeDistEps(pe.SourcePoint, pe.TargetPoint && pe.Target.PolylinePoint.Polyline!=pe.Source.PolylinePoint.Polyline))
//             //        l.Add(new LineSegment(pe.SourcePoint, pe.TargetPoint));
//             //}

//             //foreach(PEdge pe of this.graphOfHoleBoundaries.Edges)
//             //    l.Add(new LineSegment(pe.SourcePoint, pe.TargetPoint));

//             //SugiyamaLayoutSettings.Show(l.ToArray());
// #endif
// }

// //this code will work for convex holes
// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void SweepPolylinePoint(PolylinePoint v) {
//   PolylinePoint inSide = GetIncomingSide(v);
//   PolylinePoint outSide = GetOutgoingSide(v);

//   //if (inEdge != null && outEdge != null)
//   //    SugiyamaLayoutSettings.Show(new LineSegment(inEdge.start.point, inEdge.End.point), new LineSegment(outEdge.start.point,
//   //        outEdge.End.point), new LineSegment(this.q, v.point));
//   //else if (inEdge != null)
//   //    SugiyamaLayoutSettings.Show(new LineSegment(inEdge.start.point, inEdge.End.point), new LineSegment(this.q, v.point));
//   //else if (outEdge != null)
//   //    SugiyamaLayoutSettings.Show(new LineSegment(outEdge.start.point, outEdge.End.point), new LineSegment(this.q, v.point));

//   activeEdgeComparer.IntersectionOfTheRayAndInsertedEdge = v.point;
//   RBNode < PolylinePoint > node;
//   if (sideNodes.TryGetValue(inSide, out node) && node != null) {
//     //we have an active edge
//     if (node == activeSidesTree.TreeMinimum())
//       addEdge(v);

//     if (outSide != null) {
//       node.Item = outSide; //just replace the edge since the order does not change
//       sideNodes[outSide] = node;
//     } else {
//       RBNode < PolylinePoint > changedNode = activeSidesTree.DeleteSubtree(node);
//       if (changedNode != null)
//         if (changedNode.Item != null)
//           sideNodes[changedNode.Item] = changedNode;
//     }
//     sideNodes.Remove(inSide);
//   } else //the incoming edge is not active
//     if (outSide != null) {
//       RBNode < PolylinePoint > outsideNode;
//       if (!sideNodes.TryGetValue(outSide, out outsideNode) || outsideNode == null) {
//         outsideNode = activeSidesTree.Insert(outSide);
//         sideNodes[outSide] = outsideNode;
//         if (outsideNode == activeSidesTree.TreeMinimum())
//           addEdge(v);
//       }
//     } else
//       throw new Error();

//   // CheckActiveSidesAreConsistent();
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void addEdge(PolylinePoint v) {
//   if (visibilityKind == VisibilityKind.Regular ||
//     (visibilityKind == VisibilityKind.Tangent && LineTouchesPolygon(QVertex.point, v))) {
//     visibilityGraph.addEdge(QVertex.point, v.point, ((a, b) => new TollFreeVisibilityEdge(a, b)));
//   }
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         static bool LineTouchesPolygon(Point a, PolylinePoint p) {
//   Point prev = p.Polyline.Prev(p).point;
//   Point next = p.Polyline.next(p).point;
//   Point v = p.point;
//   return Point.SignedDoubledTriangleArea(a, v, prev) * Point.SignedDoubledTriangleArea(a, v, next) >= 0;
// }

// #if TEST_MSAGL
// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// // ReSharper disable UnusedMember.Local
// void DrawActiveEdgesAndVisibleGraph() {
//   // ReSharper restore UnusedMember.Local
//   var l = new List<ICurve>();
//   foreach(VisibilityEdge pe of visibilityGraph.Edges)
//   l.Add(new LineSegment(pe.SourcePoint, pe.TargetPoint));

//   foreach(PolylinePoint pe of activeSidesTree)
//   l.Add(new LineSegment(pe.point, pe.NextOnPolyline.point));
//   l.Add(new Ellipse(0.1, 0.1, q));

//   LayoutAlgorithmSettings.Show(l.ToArray());
// }
// #endif

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// PolylinePoint GetOutgoingSide(PolylinePoint v) {
//   Stem visibleStem = visibleBoundaries[v.Polyline];

//   if (v == visibleStem.End)
//     return null;

//   return v;
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
//         static PolylinePoint GetIncomingSide(PolylinePoint v) {
//   return v.PrevOnPolyline;
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void ComputeHoleBoundariesPossiblyVisibleFromQ() {
//   InitActiveEdgesAndActiveEdgesComparer();

//   foreach(Polyline hole of holes)
//   ComputeVisiblePartOfTheHole(hole);
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void InitActiveEdgesAndActiveEdgesComparer() {
//   activeEdgeComparer = new ActiveEdgeComparerWithRay { Pivot = q };
//   activeSidesTree = new RBTree<PolylinePoint>(activeEdgeComparer);
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// void ComputeVisiblePartOfTheHole(Polyline hole) {
//   //find a separating edge
//   PolylinePoint a;
//   var needToGoCounterclockWise = true;

//   for (a = hole.startPoint; !HoleSideIsVisibleFromQ(hole, a); a = hole.next(a)) {
//     Assert.assert(needToGoCounterclockWise || a != hole.startPoint);
//     //check that we have not done the full circle
//     needToGoCounterclockWise = false;
//   }

//   PolylinePoint b = hole.next(a);

//   //now the side a, a.next - is separating
//   if (needToGoCounterclockWise)
//     while (HoleSideIsVisibleFromQ(hole, hole.Prev(a)))
//       a = hole.Prev(a);

//   //go clockwise starting from b
//   for (; HoleSideIsVisibleFromQ(hole, b); b = hole.next(b)) { }

//   visibleBoundaries[hole] = new Stem(a, b);
// }

// [SuppressMessage("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
// bool HoleSideIsVisibleFromQ(Polyline hole, PolylinePoint b) {
//   return Point.SignedDoubledTriangleArea(q, b.point, hole.next(b).point) >= -ApproximateComparer.SquareOfDistanceEpsilon;
// }
// }
