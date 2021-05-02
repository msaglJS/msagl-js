import {Curve} from '../../math/geometry/curve'
import {ICurve} from '../../math/geometry/icurve'
import {LineSegment} from '../../math/geometry/lineSegment'
import {Point} from '../../math/geometry/point'
import {Rectangle} from '../../math/geometry/rectangle'
import {SmoothedPolyline} from '../../math/geometry/smoothedPolyline'
import {BasicGraph} from '../../structs/BasicGraph'
import {IntPair} from '../../utils/IntPair'
import {GeomGraph} from '../core/GeomGraph'
import {Algorithm} from './../../utils/algorithm'
import {Anchor} from './anchor'
import {Database} from './Database'
import {LayerArrays} from './LayerArrays'
import {PolyIntEdge} from './polyIntEdge'
import {ProperLayeredGraph} from './ProperLayeredGraph'
import {SugiyamaLayoutSettings} from './SugiyamaLayoutSettings'
//import { FlatEdgeRouter } from './FlatEdgeRouter'
import {CornerSite} from '../../math/geometry/cornerSite'
import {NodeKind} from './NodeKind'
import {Arrowhead} from '../core/arrowhead'
import {GeomNode} from '../core/geomNode'
import {SmoothedPolylineCalculator} from './SmoothedPolylineCalculator'
import {GeomEdge} from '../core/geomEdge'
import {Assert} from '../../utils/assert'
//  The class responsible for the routing of splines
export class Routing extends Algorithm {
  settings: SugiyamaLayoutSettings

  Database: Database

  IntGraph: BasicGraph<GeomNode, PolyIntEdge>

  LayerArrays: LayerArrays

  OriginalGraph: GeomGraph

  ProperLayeredGraph: ProperLayeredGraph

  constructor(
    settings: SugiyamaLayoutSettings,
    originalGraph: GeomGraph,
    dbP: Database,
    yLayerArrays: LayerArrays,
    properLayeredGraph: ProperLayeredGraph,
    intGraph: BasicGraph<GeomNode, PolyIntEdge>,
  ) {
    super(null) // todo: init with the not null canceltoken
    this.settings = settings
    this.OriginalGraph = originalGraph
    this.Database = dbP
    this.ProperLayeredGraph = properLayeredGraph
    this.LayerArrays = yLayerArrays
    this.IntGraph = intGraph
  }

  //  Executes the actual algorithm.
  run() {
    this.CreateSplines()
  }

  //  The method does the main work.
  CreateSplines() {
    this.CreateRegularSplines()
    this.CreateSelfSplines()
    if (this.IntGraph != null) {
      this.RouteFlatEdges()
    }
  }

  RouteFlatEdges() {
    //  throw new Error('not implemented')
    // const flatEdgeRouter = new FlatEdgeRouter(this.settings, this)
    // flatEdgeRouter.run()
  }

  CreateRegularSplines() {
    for (const intEdgeList of this.Database.RegularMultiedges()) {
      // Here we try to optimize multi-edge routing
      const m = intEdgeList.length
      const optimizeShortEdges: boolean =
        m == 1 && !this.FanAtSourceOrTarget(intEdgeList[0])
      for (let i: number = Math.floor(m / 2); i < m; i++) {
        this.CreateSplineForNonSelfEdge(intEdgeList[i], optimizeShortEdges)
      }

      for (let i = Math.floor(m / 2) - 1; i >= 0; i--) {
        this.CreateSplineForNonSelfEdge(intEdgeList[i], optimizeShortEdges)
      }
    }
  }

  FanAtSourceOrTarget(intEdge: PolyIntEdge): boolean {
    return (
      this.ProperLayeredGraph.OutDegreeIsMoreThanOne(intEdge.source) ||
      this.ProperLayeredGraph.InDegreeIsMoreThanOne(intEdge.target)
    )
  }

  CreateSelfSplines() {
    for (const [k, v] of this.Database.Multiedges.keyValues()) {
      const ip: IntPair = k
      if (ip.x == ip.y) {
        const anchor: Anchor = this.Database.Anchors[ip.x]
        let offset: number = anchor.leftAnchor
        for (const intEdge of v) {
          const dx: number =
            this.settings.NodeSeparation + (this.settings.MinNodeWidth + offset)
          const dy: number = anchor.bottomAnchor / 2
          const p0: Point = anchor.Origin
          const p1: Point = p0.add(new Point(0, dy))
          const p2: Point = p0.add(new Point(dx, dy))
          const p3: Point = p0.add(new Point(dx, dy * -1))
          const p4: Point = p0.add(new Point(0, dy * -1))
          let s = CornerSite.mkSiteP(p0)
          const polyline = new SmoothedPolyline(s)
          s = CornerSite.mkSiteSP(s, p1)
          s = CornerSite.mkSiteSP(s, p2)
          s = CornerSite.mkSiteSP(s, p3)
          s = CornerSite.mkSiteSP(s, p4)
          CornerSite.mkSiteSP(s, p0)
          const c: Curve = polyline.createCurve()
          intEdge.curve = c
          intEdge.edge.underlyingPolyline = polyline
          offset = dx
          if (intEdge.edge.label != null) {
            offset += intEdge.edge.label.width
            const center = (intEdge.edge.label.center = new Point(
              c.value((c.parStart + c.parEnd) / 2).x + intEdge.labelWidth / 2,
              anchor.y,
            ))
            const del = new Point(
              intEdge.edge.label.width / 2,
              intEdge.edge.label.height / 2,
            )
            const box = Rectangle.mkPP(center.add(del), center.sub(del))
            intEdge.edge.label.boundingBox = box
          }

          Arrowhead.trimSplineAndCalculateArrowheadsII(
            intEdge.edge.edgeGeometry,
            intEdge.edge.source.boundaryCurve,
            intEdge.edge.target.boundaryCurve,
            c,
            false,
          )
        }
      }
    }
  }

  CreateSplineForNonSelfEdge(es: PolyIntEdge, optimizeShortEdges: boolean) {
    if (es.LayerEdges != null) {
      this.DrawSplineBySmothingThePolyline(es, optimizeShortEdges)
      if (!es.IsVirtualEdge) {
        es.updateEdgeLabelPosition(this.Database.Anchors)
        Arrowhead.trimSplineAndCalculateArrowheadsII(
          es.edge.edgeGeometry,
          es.edge.source.boundaryCurve,
          es.edge.target.boundaryCurve,
          es.curve,
          true,
        )
      }
    }
  }

  DrawSplineBySmothingThePolyline(
    edgePath: PolyIntEdge,
    optimizeShortEdges: boolean,
  ) {
    const scalc = new SmoothedPolylineCalculator(
      edgePath,
      this.Database.Anchors,
      this.OriginalGraph,
      this.settings,
      this.LayerArrays,
      this.ProperLayeredGraph,
      this.Database,
    )
    const spline: ICurve = scalc.GetSpline(optimizeShortEdges)
    if (edgePath.reversed) {
      edgePath.curve = spline.reverse()
      edgePath.underlyingPolyline = scalc.Reverse().GetPolyline
    } else {
      edgePath.curve = spline
      edgePath.underlyingPolyline = scalc.GetPolyline
    }
  }

  // void UpdateEdgeLabelPosition(LayerEdge[][] list, int i) {
  //     IntEdge e;
  //     int labelNodeIndex;
  //     if (Engine.GetLabelEdgeAndVirtualNode(list, i, out e, out labelNodeIndex)) {
  //         UpdateLabel(e, labelNodeIndex, db.Anchors);
  //     }
  // }
  static UpdateLabel(e: GeomEdge, anchor: Anchor) {
    let labelSide: LineSegment = null
    if (anchor.labelToTheRightOfAnchorCenter) {
      e.label.center = new Point(anchor.x + anchor.rightAnchor / 2, anchor.y)
      labelSide = LineSegment.mkPP(e.labelBBox.leftTop, e.labelBBox.leftBottom)
    } else if (anchor.labelToTheLeftOfAnchorCenter) {
      e.label.center = new Point(anchor.x - anchor.leftAnchor / 2, anchor.y)
      labelSide = LineSegment.mkPP(
        e.labelBBox.rightTop,
        e.labelBBox.rightBottom,
      )
    }

    const segmentInFrontOfLabel: ICurve = Routing.GetSegmentInFrontOfLabel(
      e.curve,
      e.label.center.y,
    )
    if (segmentInFrontOfLabel == null) {
      return
    }

    if (
      Curve.getAllIntersections(e.curve, Curve.polyFromBox(e.labelBBox), false)
        .length == 0
    ) {
      const t: {curveClosestPoint: Point; labelSideClosest: Point} = {
        curveClosestPoint: undefined,
        labelSideClosest: undefined,
      }
      let labelSideClosest: Point
      if (Routing.FindClosestPoints(t, segmentInFrontOfLabel, labelSide)) {
        // shift the label if needed
        Routing.ShiftLabel(e, t)
      } else {
        // assume that the distance is reached at the ends of labelSideClosest
        const u: number = segmentInFrontOfLabel.closestParameter(
          labelSide.start,
        )
        const v: number = segmentInFrontOfLabel.closestParameter(labelSide.end)
        if (
          segmentInFrontOfLabel.value(u).sub(labelSide.start).length <
          segmentInFrontOfLabel.value(v).sub(labelSide.end).length
        ) {
          t.curveClosestPoint = segmentInFrontOfLabel[u]
          t.labelSideClosest = labelSide.start
        } else {
          t.curveClosestPoint = segmentInFrontOfLabel[v]
          t.labelSideClosest = labelSide.end
        }

        Routing.ShiftLabel(e, t)
      }
    }
  }

  static ShiftLabel(
    e: GeomEdge,
    t: {curveClosestPoint: Point; labelSideClosest: Point},
  ) {
    const w: number = e.lineWidth / 2
    const shift: Point = t.curveClosestPoint.sub(t.labelSideClosest)
    const shiftLength: number = shift.length
    //    SugiyamaLayoutSettings.Show(e.Curve, shiftLength > 0 ? new LineSegment(curveClosestPoint, labelSideClosest) : null, PolyFromBox(e.LabelBBox));
    if (shiftLength > w) {
      e.label.center = e.label.center.add(
        shift.div(shiftLength * (shiftLength - w)),
      )
    }
  }

  static FindClosestPoints(
    t: {curveClosestPoint: Point; labelSideClosest: Point},
    segmentInFrontOfLabel: ICurve,
    labelSide: LineSegment,
  ): boolean {
    const di = Curve.minDistWithinIntervals(
      segmentInFrontOfLabel,
      labelSide,
      segmentInFrontOfLabel.parStart,
      segmentInFrontOfLabel.parEnd,
      labelSide.parStart,
      labelSide.parEnd,
      (segmentInFrontOfLabel.parStart + segmentInFrontOfLabel.parEnd) / 2,
      (labelSide.parStart + labelSide.parEnd) / 2,
    )
    if (di) {
      t.curveClosestPoint = di.aX
      t.labelSideClosest = di.bX
      return true
    }
    return false
  }

  static GetSegmentInFrontOfLabel(edgeCurve: ICurve, labelY: number): ICurve {
    const curve = <Curve>edgeCurve
    if (curve != null) {
      for (const seg of curve.segs) {
        if ((seg.start.y - labelY) * (seg.end.y - labelY) <= 0) {
          return seg
        }
      }
    } else {
      Assert.assert(false)
    }

    // not implemented
    return null
  }

  static GetNodeKind(vertexOffset: number, edgePath: PolyIntEdge): NodeKind {
    return vertexOffset == 0
      ? NodeKind.Top
      : vertexOffset < edgePath.count
      ? NodeKind.Internal
      : NodeKind.Bottom
  }
}
