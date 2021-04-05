﻿// using System;
// using System.Collections.Generic;
// using System.Diagnostics;
// using System.Linq;
// using Microsoft.Msagl.Core.DataStructures;
// using Microsoft.Msagl.Core.Geometry;
// using Microsoft.Msagl.Core.Geometry.Curves;

// namespace Microsoft.Msagl.Routing.ConstrainedDelaunayTriangulation {
//     internal class EdgeTracer {
//         readonly CdtEdge edge;
//         readonly Set<CdtTriangle> triangles;
//         readonly RbTree<CdtFrontElement> front;
//         readonly List<CdtSite> leftPolygon;
//         readonly List<CdtSite> rightPolygon;

//         // <summary>
//         // the upper site of the edge
//         // </summary>
//         CdtSite a;
//         // <summary>
//         // the lower site of the edge
//         // </summary>
//         CdtSite b;
//         CdtEdge piercedEdge;
//         CdtTriangle piercedTriangle;
//         RBNode<CdtFrontElement> piercedToTheLeftFrontElemNode;
//         RBNode<CdtFrontElement> piercedToTheRightFrontElemNode;
//         List<CdtFrontElement> elementsToBeRemovedFromFront = new List<CdtFrontElement>();
//         List<CdtTriangle> removedTriangles = new List<CdtTriangle>();

//         public EdgeTracer(CdtEdge edge, Set<CdtTriangle> triangles, RbTree < CdtFrontElement > front, List < CdtSite > leftPolygon, List < CdtSite > rightPolygon) {
//         this.edge = edge;
//         this.triangles = triangles;
//         this.front = front;
//         this.leftPolygon = leftPolygon;
//         this.rightPolygon = rightPolygon;
//         a = edge.upperSite;
//         b = edge.lowerSite;
//     }

//         public void Run() {
//         Init();
//         Traverse();
//     }

//     void Traverse() {
//         while (!BIsReached()) {
//             if (piercedToTheLeftFrontElemNode != null) { ProcessLeftFrontPiercedElement(); }
//             else if (piercedToTheRightFrontElemNode != null) {
//                 ProcessRightFrontPiercedElement();
//             }
//             else ProcessPiercedEdge();
//         }
//         if (piercedTriangle != null)
//             RemovePiercedTriangle(piercedTriangle);

//         FindMoreRemovedFromFrontElements();

//         foreach(var elem of elementsToBeRemovedFromFront)
//         front.Remove(elem);
//     }

//     void ProcessLeftFrontPiercedElement() {
//         // CdtSweeper.ShowFront(triangles, front,new []{new LineSegment(a.point, b.point),new LineSegment(piercedToTheLeftFrontElemNode.Item.Edge.lowerSite.point,piercedToTheLeftFrontElemNode.Item.Edge.upperSite.point)},null);
//         var v = piercedToTheLeftFrontElemNode;

//         do {
//             elementsToBeRemovedFromFront.Add(v.Item);
//             AddSiteToLeftPolygon(v.Item.LeftSite);
//             v = front.Previous(v);
//         } while (Point.PointToTheLeftOfLine(v.Item.LeftSite.point, a.point, b.point)); //that is why we are adding to the left polygon
//         elementsToBeRemovedFromFront.Add(v.Item);
//         AddSiteToRightPolygon(v.Item.LeftSite);
//         if (v.Item.LeftSite == b) {
//             piercedToTheLeftFrontElemNode = v; //this will stop the traversal
//             return;
//         }
//         FindPiercedTriangle(v);
//         piercedToTheLeftFrontElemNode = null;
//     }

//     void FindPiercedTriangle(RBNode < CdtFrontElement > v) {
//         var e = v.Item.Edge;
//         var t = e.CcwTriangle ?? e.CwTriangle;
//         var eIndex = t.Edges.Index(e);
//         for (int i = 1; i <= 2; i++) {
//             var ei = t.Edges[i + eIndex];
//             var signedArea0 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(ei.lowerSite.point, a.point, b.point));
//             var signedArea1 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(ei.upperSite.point, a.point, b.point));
//             if (signedArea1 * signedArea0 <= 0) {
//                 piercedTriangle = t;
//                 piercedEdge = ei;
//                 break;
//             }
//         }
//     }

//     void FindMoreRemovedFromFrontElements() {
//         foreach(var triangle of removedTriangles) {
//             foreach(var e of triangle.Edges) {
//                 if (e.CcwTriangle == null && e.CwTriangle == null) {
//                     var site = e.upperSite.point.X < e.lowerSite.point.X ? e.upperSite : e.lowerSite;
//                     var frontNode = CdtSweeper.FindNodeInFrontBySite(front, site);
//                     if (frontNode.Item.Edge == e)
//                         elementsToBeRemovedFromFront.Add(frontNode.Item);
//                 }
//             }
//         }
//     }

//     void ProcessPiercedEdge() {
//         //if(CdtSweeper.db)
//         //          CdtSweeper.ShowFront(triangles, front, new[] { new LineSegment(a.point, b.point) },
//         //                      new[] { new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point) });
//         if (piercedEdge.CcwTriangle == piercedTriangle) {
//             AddSiteToLeftPolygon(piercedEdge.lowerSite);
//             AddSiteToRightPolygon(piercedEdge.upperSite);
//         }
//         else {
//             AddSiteToLeftPolygon(piercedEdge.upperSite);
//             AddSiteToRightPolygon(piercedEdge.lowerSite);
//         }

//         RemovePiercedTriangle(piercedTriangle);
//         PrepareNextStateAfterPiercedEdge();
//     }

//     void PrepareNextStateAfterPiercedEdge() {
//         var t = piercedEdge.CwTriangle ?? piercedEdge.CcwTriangle;
//         var eIndex = t.Edges.Index(piercedEdge);
//         for (int i = 1; i <= 2; i++) {
//             var e = t.Edges[i + eIndex];
//             var signedArea0 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(e.lowerSite.point, a.point, b.point));
//             var signedArea1 = ApproximateComparer.Sign(Point.SignedDoubledTriangleArea(e.upperSite.point, a.point, b.point));
//             if (signedArea1 * signedArea0 <= 0) {
//                 if (e.CwTriangle != null && e.CcwTriangle != null) {
//                     piercedTriangle = t;
//                     piercedEdge = e;
//                     break;
//                 }
//                 //e has to belong to the front, and its triangle has to be removed
//                 piercedTriangle = null;
//                 piercedEdge = null;
//                 var leftSite = e.upperSite.point.X < e.lowerSite.point.X ? e.upperSite : e.lowerSite;
//                 var frontElem = CdtSweeper.FindNodeInFrontBySite(front, leftSite);
//                 Assert.assert(frontElem != null);
//                 if (leftSite.point.X < a.point.X)
//                     piercedToTheLeftFrontElemNode = frontElem;
//                 else
//                     piercedToTheRightFrontElemNode = frontElem;

//                 RemovePiercedTriangle(e.CwTriangle ?? e.CcwTriangle);
//                 break;
//             }
//         }
//     }

//     void RemovePiercedTriangle(CdtTriangle t) {
//         triangles.Remove(t);
//         foreach(var e of t.Edges)
//         if (e.CwTriangle == t)
//             e.CwTriangle = null;
//         else e.CcwTriangle = null;
//         removedTriangles.Add(t);
//     }

//     void ProcessRightFrontPiercedElement() {
//         var v = piercedToTheRightFrontElemNode;

//         do {
//             elementsToBeRemovedFromFront.Add(v.Item);
//             AddSiteToRightPolygon(v.Item.RightSite);
//             v = front.next(v);
//         } while (Point.PointToTheRightOfLine(v.Item.RightSite.point, a.point, b.point)); //that is why we are adding to the right polygon
//         elementsToBeRemovedFromFront.Add(v.Item);
//         AddSiteToLeftPolygon(v.Item.RightSite);
//         if (v.Item.RightSite == b) {
//             piercedToTheRightFrontElemNode = v; //this will stop the traversal
//             return;
//         }
//         FindPiercedTriangle(v);
//         piercedToTheRightFrontElemNode = null;
//     }

//     void AddSiteToLeftPolygon(CdtSite site) {
//         AddSiteToPolygonWithCheck(site, leftPolygon);
//     }

//     void AddSiteToPolygonWithCheck(CdtSite site, List < CdtSite > list) {
//         if (site == b) return;

//         if (list.Count == 0 || list[list.Count - 1] != site)
//             list.Add(site);

//     }

//     void AddSiteToRightPolygon(CdtSite site) {
//         AddSiteToPolygonWithCheck(site, rightPolygon);
//     }

//     bool BIsReached() {
//         var node = piercedToTheLeftFrontElemNode ?? piercedToTheRightFrontElemNode;
//         if (node != null)
//             return node.Item.Edge.IsAdjacent(b);
//         return piercedEdge.IsAdjacent(b);
//     }

//     void Init() {
//         //            if (CdtSweeper.D)
//         //                CdtSweeper.ShowFront(triangles, front, new[] {new LineSegment(a.point, b.point)},null);
//         //new[] {new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point)});
//         var frontElemNodeRightOfA = CdtSweeper.FindNodeInFrontBySite(front, a);
//         var frontElemNodeLeftOfA = front.Previous(frontElemNodeRightOfA);
//         if (Point.PointToTheLeftOfLine(b.point, frontElemNodeLeftOfA.Item.LeftSite.point, frontElemNodeLeftOfA.Item.RightSite.point))
//             piercedToTheLeftFrontElemNode = frontElemNodeLeftOfA;
//         else if (Point.PointToTheRightOfLine(b.point, frontElemNodeRightOfA.Item.RightSite.point, frontElemNodeRightOfA.Item.LeftSite.point))
//             piercedToTheRightFrontElemNode = frontElemNodeRightOfA;
//         else {
//             foreach(var e of a.Edges) {
//                 var t = e.CcwTriangle;
//                 if (t == null) continue;
//                 if (Point.PointToTheLeftOfLine(b.point, e.lowerSite.point, e.upperSite.point))
//                     continue;
//                 var eIndex = t.Edges.Index(e);
//                 var site = t.Sites[eIndex + 2];
//                 if (Point.PointToTheLeftOfLineOrOnLine(b.point, site.point, e.upperSite.point)) {
//                     piercedEdge = t.Edges[eIndex + 1];
//                     piercedTriangle = t;
//                     //                                                CdtSweeper.ShowFront(triangles, front, new[] { new LineSegment(e.upperSite.point, e.lowerSite.point) },
//                     //                                                    new[] { new LineSegment(piercedEdge.upperSite.point, piercedEdge.lowerSite.point) });
//                     break;
//                 }
//             }
//         }
//     }

// }
// }
