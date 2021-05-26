import {RealNumberSpan} from '../../utils/RealNumberSpan'
import {BasicGraph} from '../../structs/BasicGraph'
import {Point, TriangleOrientation} from '../../math/geometry/point'
import {Assert} from '../../utils/assert'
import {Algorithm} from '../../utils/algorithm'
import {PolyIntEdge} from './polyIntEdge'
import {SugiyamaLayoutSettings, SnapToGridByY} from './SugiyamaLayoutSettings'
import {from, IEnumerable} from 'linq-to-typescript'
import {IEdge} from '../../structs/iedge'
import {CycleRemoval} from './CycleRemoval'
import {GeomNode} from '../core/geomNode'
import {Database} from './Database'
import {LayerArrays, layersAreCorrect} from './LayerArrays'
import {GeomEdge} from '../core/geomEdge'
import {GeomGraph} from '../core/GeomGraph'
import {IntPairMap} from '../../utils/IntPairMap'
import {IntPairSet} from '../../utils/IntPairSet'
import {IntPair} from '../../utils/IntPair'
import {CancelToken} from '../../utils/cancelToken'
import {Balancing} from './Balancing'
import {LayerCalculator} from './layering/layerCalculator'
import {ConstrainedOrdering} from './ordering/ConstrainedOrdering'
import {ProperLayeredGraph} from './ProperLayeredGraph'
import {LayerEdge} from './LayerEdge'
import {EdgePathsInserter} from './EdgePathsInserter'
import {LayerInserter} from './LayerInserter'
import {Ordering} from './ordering/Ordering'
import {MetroMapOrdering} from './ordering/MetroMapOrdering'
import {NetworkSimplexForGeneralGraph} from './layering/NetworkSimplexForGeneralGraph'
import {Anchor} from './anchor'
import {XCoordsWithAlignment} from './XCoordsWithAlignment'
import {BasicGraphOnEdges} from '../../structs/basicGraphOnEdges'
import {XLayoutGraph} from './XLayoutGraph'
import {Rectangle} from '../../math/geometry/rectangle'
import {NetworkSimplex} from './layering/NetworkSimplex'
import {GeomConstants} from '../../math/geometry/geomConstants'
import {EdgeRoutingMode} from '../../core/routing/EdgeRoutingMode'
import {EdgeRoutingSettings} from '../../core/routing/EdgeRoutingSettings'
import {Routing} from './routing'
import {PlaneTransformation} from '../../math/geometry/planeTransformation'

export class LayeredLayout extends Algorithm {
  originalGraph: GeomGraph
  sugiyamaSettings: SugiyamaLayoutSettings
  nodeIdToIndex: Map<string, number>
  IntGraph: BasicGraph<GeomNode, PolyIntEdge>
  database: Database
  engineLayerArrays: LayerArrays
  gluedDagSkeletonForLayering: BasicGraph<GeomNode, PolyIntEdge>
  constrainedOrdering: ConstrainedOrdering
  properLayeredGraph: ProperLayeredGraph
  LayersAreDoubled = false
  Brandes: boolean
  anchors: Anchor[]
  xLayoutGraph: XLayoutGraph

  get verticalConstraints() {
    return this.sugiyamaSettings.verticalConstraints
  }
  get HorizontalConstraints() {
    return this.sugiyamaSettings.horizontalConstraints
  }

  constructor(
    originalGraph: GeomGraph,
    settings: SugiyamaLayoutSettings,
    cancelToken: CancelToken,
  ) {
    super(cancelToken)
    if (originalGraph == null) return
    this.originalGraph = originalGraph
    this.sugiyamaSettings = settings
    //enumerate the nodes - maps node indices to strings
    const nodes = from(originalGraph.nodes()).toArray()
    this.nodeIdToIndex = new Map<string, number>()

    let index = 0
    for (const n of this.originalGraph.nodes()) {
      this.nodeIdToIndex.set(n.id, index++)
      Assert.assert(!n.node.isGraph)
    }

    const intEdges = new Array<PolyIntEdge>(this.originalGraph.edgeCount)
    let i = 0
    for (const edge of this.originalGraph.edges()) {
      Assert.assert(!(edge.source == null || edge.target == null))

      const intEdge = new PolyIntEdge(
        this.nodeIdToIndex.get(edge.source.id),
        this.nodeIdToIndex.get(edge.target.id),
        edge,
      )

      intEdges[i++] = intEdge
    }

    this.IntGraph = new BasicGraph<GeomNode, PolyIntEdge>(
      intEdges,
      originalGraph.nodeCount,
    )
    this.IntGraph.nodes = nodes
    this.database = new Database(nodes.length)
    for (const e of this.IntGraph.edges)
      this.database.registerOriginalEdgeInMultiedges(e)

    this.cycleRemoval()
  }
  run() {
    if (this.originalGraph.nodeCount == 0) {
      this.originalGraph.boundingBox.setToEmpty()
      return
    }
    preRunTransform(this.originalGraph, this.sugiyamaSettings.transform)
    this.engineLayerArrays = this.calculateLayers()
    if (!this.sugiyamaSettings.layeringOnly) {
      this.runPostLayering()
    }
    postRunTransform(
      this.originalGraph,
      this.sugiyamaSettings.transform,
      this.sugiyamaSettings.margins,
    )
    this.originalGraph.updateBoundingBox()
    this.originalGraph.transform(
      new PlaneTransformation(
        1,
        0,
        -this.originalGraph.left + this.sugiyamaSettings.margins.left,
        0,
        -1,
        this.originalGraph.top + this.sugiyamaSettings.margins.top,
      ),
    ) // flip the y coordinate to according to the screen standard and shift to origin
    this.originalGraph.boundingBox.right += this.sugiyamaSettings.margins.right
    this.originalGraph.boundingBox.top += this.sugiyamaSettings.margins.bottom
    this.originalGraph.boundingBox.left = 0
    this.originalGraph.boundingBox.bottom = 0
  }

  runPostLayering() {
    const routingSettings: EdgeRoutingSettings = this.sugiyamaSettings
      .EdgeRoutingSettings
    const mode =
      this.constrainedOrdering != null
        ? EdgeRoutingMode.Spline
        : routingSettings.EdgeRoutingMode

    switch (mode) {
      case EdgeRoutingMode.SugiyamaSplines:
        this.calculateEdgeSplines()
        break
      case EdgeRoutingMode.StraightLine:
        throw new Error('not implemented')

        // StraightLineEdges.SetStraightLineEdgesWithUnderlyingPolylines(
        //   this.originalGraph,
        // )
        this.SetLabels()
        break
      case EdgeRoutingMode.Spline:
        throw new Error('not implemented')

        break
      case EdgeRoutingMode.SplineBundling:
        throw new Error('not implemented')
        break
      case EdgeRoutingMode.Rectilinear:
      case EdgeRoutingMode.RectilinearToCenter:
        throw new Error('Not implemented yet')

        break
      default:
        throw new Error('Unexpected mode ' + mode)
    }
  }

  SetLabels() {
    throw new Error('not implementedt')
    // const edgeLabeller = new EdgeLabelPlacement(originalGraph)
    // edgeLabeller.run()
  }

  cycleRemoval() {
    const verticalConstraints = this.sugiyamaSettings.verticalConstraints
    const feedbackSet: IEdge[] = verticalConstraints.isEmpty
      ? CycleRemoval.getFeedbackSet(this.IntGraph)
      : verticalConstraints.getFeedbackSetExternal(
          this.IntGraph,
          this.nodeIdToIndex,
        )

    this.database.addFeedbackSet(feedbackSet)
  }
  calculateLayers(): LayerArrays {
    this.CreateGluedDagSkeletonForLayering()
    const layerArrays = this.CalculateLayerArrays()
    this.UpdateNodePositionData()
    return layerArrays
  }

  UpdateNodePositionData() {
    this.TryToSatisfyMinWidhtAndMinHeight()

    for (
      let i = 0;
      i < this.IntGraph.nodeCount && i < this.database.Anchors.length;
      i++
    )
      this.IntGraph.nodes[i].center = this.database.Anchors[i].Origin

    if (this.sugiyamaSettings.GridSizeByX > 0) {
      for (let i = 0; i < this.originalGraph.nodeCount; i++) {
        this.SnapLeftSidesOfTheNodeToGrid(i, this.sugiyamaSettings.GridSizeByX)
      }
    }
  }

  SnapLeftSidesOfTheNodeToGrid(i: number, gridSize: number) {
    const node = this.IntGraph.nodes[i]
    const anchor = this.database.Anchors[i]
    anchor.leftAnchor -= gridSize / 2
    anchor.rightAnchor -= gridSize / 2
    const left = node.boundingBox.left
    const k = Math.floor(left / gridSize)
    const delta: number = left - k * gridSize
    if (Math.abs(delta) < 0.001) {
      return
    }

    //  we are free to shift at least gridSize horizontally
    //  find the minimal shift
    if (Math.abs(delta) <= gridSize / 2) {
      node.center = node.center.add(new Point(-delta, 0))
      //  shifting to the left
    } else {
      node.center = node.center.add(new Point(gridSize - delta, 0))
      //  shifting to the right
    }

    anchor.x = node.center.x
  }

  TryToSatisfyMinWidhtAndMinHeight() {
    this.TryToSatisfyMinWidth()
    this.TryToSatisfyMinHeight()
  }

  TryToSatisfyMinWidth() {
    if (this.sugiyamaSettings.MinimalWidth == 0) {
      return
    }

    const w: number = this.GetCurrentWidth()
    if (w < this.sugiyamaSettings.MinimalWidth) {
      this.StretchWidth()
    }
  }

  StretchWidth() {
    // calculate the desired span of the anchor centers and the current span of anchor center
    const desiredSpan = new RealNumberSpan()
    for (const node of this.originalGraph.nodes()) {
      desiredSpan.AddValue(node.boundingBox.width / 2)
      desiredSpan.AddValue(
        this.sugiyamaSettings.MinimalWidth - node.boundingBox.width / 2,
      )
    }

    const currentSpan = new RealNumberSpan()
    for (const anchor of this.NodeAnchors()) {
      currentSpan.AddValue(anchor.x)
    }

    if (currentSpan.length > GeomConstants.distanceEpsilon) {
      const stretch: number = desiredSpan.length / currentSpan.length
      if (stretch > 1) {
        for (const a of this.anchors) {
          a.x *= stretch
        }
      }
    }
  }

  TryToSatisfyMinHeight() {
    if (this.sugiyamaSettings.MinimalHeight == 0) {
      return
    }

    const h: number = this.GetCurrentHeight()
    if (h < this.sugiyamaSettings.MinimalHeight) {
      this.StretchHeight()
    }
  }

  GetCurrentHeight(): number {
    const span = new RealNumberSpan()
    for (const anchor of this.NodeAnchors()) {
      span.AddValue(anchor.top)
      span.AddValue(anchor.bottom)
    }

    return span.length
  }

  StretchHeight() {
    const desiredSpan = new RealNumberSpan()
    for (const node of this.originalGraph.nodes()) {
      desiredSpan.AddValue(node.boundingBox.height / 2)
      desiredSpan.AddValue(
        this.sugiyamaSettings.MinimalHeight - node.boundingBox.height / 2,
      )
    }

    const currentSpan = new RealNumberSpan()
    for (const anchor of this.NodeAnchors()) {
      currentSpan.AddValue(anchor.y)
    }

    if (currentSpan.length > GeomConstants.distanceEpsilon) {
      const stretch: number = desiredSpan.length / currentSpan.length
      if (stretch > 1) {
        for (const a of this.anchors) {
          a.y *= stretch
        }
      }
    }
  }

  *NodeAnchors(): IterableIterator<Anchor> {
    const n = Math.min(this.IntGraph.nodeCount, this.anchors.length)
    for (let i = 0; i < n; i++) yield this.anchors[i]
  }

  GetCurrentWidth(): number {
    const span = new RealNumberSpan()
    for (const anchor of this.NodeAnchors()) {
      span.AddValue(anchor.left)
      span.AddValue(anchor.right)
    }

    return span.length
  }
  ExtendLayeringToUngluedSameLayerVertices(p: number[]): number[] {
    const vc = this.verticalConstraints
    for (let i = 0; i < p.length; i++) p[i] = p[vc.nodeToRepr(i)]
    return p
  }
  calculateEdgeSplines() {
    const routing = new Routing(
      this.sugiyamaSettings,
      this.originalGraph,
      this.database,
      this.engineLayerArrays,
      this.properLayeredGraph,
      this.IntGraph,
    )
    routing.run()
  }

  YLayeringAndOrdering(layering: LayerCalculator): LayerArrays {
    let yLayers = layering.GetLayers()
    Balancing.Balance(
      this.gluedDagSkeletonForLayering,
      yLayers,
      this.GetNodeCountsOfGluedDag(),
      null,
    )

    yLayers = this.ExtendLayeringToUngluedSameLayerVertices(yLayers)

    let layerArrays = new LayerArrays(yLayers)
    Assert.assert(layersAreCorrect(layerArrays))
    if (
      this.HorizontalConstraints == null ||
      this.HorizontalConstraints.IsEmpty
    ) {
      layerArrays = this.YLayeringAndOrderingWithoutHorizontalConstraints(
        layerArrays,
      )
      return layerArrays
    }

    throw new Error('not implemented')
    // this.constrainedOrdering = new ConstrainedOrdering(
    //   this.originalGraph,
    //   this.IntGraph,
    //   layerArrays.y,
    //   this.nodeIdToIndex,
    //   this.database,
    //   this.sugiyamaSettings,
    // )
    // this.constrainedOrdering.Calculate()
    // this.properLayeredGraph = this.constrainedOrdering.ProperLayeredGraph

    // // SugiyamaLayoutSettings.ShowDatabase(this.database);
    // return this.constrainedOrdering.LayerArrays
  }

  // Creating a proper layered graph, a graph where each
  // edge goes only one layer down from the i+1-th layer to the i-th layer.

  CreateProperLayeredGraph(layering: number[]): LayerArrays {
    const n = layering.length
    let nOfVV = 0

    for (const e of this.database.SkeletonEdges()) {
      const span = EdgeSpan(layering, e)

      Assert.assert(span >= 0)

      if (span > 0) e.LayerEdges = new Array<LayerEdge>(span)
      let pe = 0 //offset in the string

      if (span > 1) {
        //we create span-2 dummy nodes and span new edges
        let d0 = n + nOfVV++

        let layerEdge = new LayerEdge(e.source, d0, e.CrossingWeight, e.weight)

        e.LayerEdges[pe++] = layerEdge

        //create span-2 internal edges all from dummy nodes
        for (let j = 0; j < span - 2; j++) {
          d0++
          nOfVV++
          layerEdge = new LayerEdge(d0 - 1, d0, e.CrossingWeight, e.weight)
          e.LayerEdges[pe++] = layerEdge
        }

        layerEdge = new LayerEdge(d0, e.target, e.CrossingWeight, e.weight)
        e.LayerEdges[pe] = layerEdge
      } else if (span == 1) {
        const layerEdge = new LayerEdge(
          e.source,
          e.target,
          e.CrossingWeight,
          e.weight,
        )
        e.LayerEdges[pe] = layerEdge
      }
    }

    const extendedVertexLayering = new Array<number>(
      this.originalGraph.nodeCount + nOfVV,
    ).fill(0)

    for (const e of this.database.SkeletonEdges())
      if (e.LayerEdges != null) {
        let l = layering[e.source]
        extendedVertexLayering[e.source] = l--
        for (const le of e.LayerEdges) extendedVertexLayering[le.Target] = l--
      } else {
        extendedVertexLayering[e.source] = layering[e.source]
        extendedVertexLayering[e.target] = layering[e.target]
      }

    this.properLayeredGraph = new ProperLayeredGraph(
      new BasicGraph<GeomNode, PolyIntEdge>(
        Array.from(this.database.SkeletonEdges()),
        layering.length,
      ),
    )
    this.properLayeredGraph.BaseGraph.nodes = this.IntGraph.nodes
    return new LayerArrays(extendedVertexLayering)
  }

  YLayeringAndOrderingWithoutHorizontalConstraints(
    layerArraysIn: LayerArrays,
  ): LayerArrays {
    Assert.assert(layersAreCorrect(layerArraysIn))
    const layerArrays = this.CreateProperLayeredGraph(layerArraysIn.y)
    Assert.assert(layersAreCorrect(layerArrays))
    Ordering.OrderLayers(
      this.properLayeredGraph,
      layerArrays,
      this.originalGraph.nodeCount,
      this.sugiyamaSettings,
      this.cancelToken,
    )
    MetroMapOrdering.UpdateLayerArrays1(this.properLayeredGraph, layerArrays)
    Assert.assert(layersAreCorrect(layerArrays))
    return layerArrays
  }

  CalculateYLayers(): LayerArrays {
    const layerArrays = this.YLayeringAndOrdering(
      new NetworkSimplexForGeneralGraph(
        this.gluedDagSkeletonForLayering,
        this.cancelToken,
      ),
    )
    Assert.assert(layersAreCorrect(layerArrays))
    if (this.constrainedOrdering != null) return layerArrays
    return this.InsertLayersIfNeeded(layerArrays)
  }

  InsertLayersIfNeeded(layerArrays: LayerArrays): LayerArrays {
    this.InsertVirtualEdgesIfNeeded(layerArrays)

    const r = this.AnalyzeNeedToInsertLayersAndHasMultiedges(layerArrays)

    if (r.needToInsertLayers) {
      const t = LayerInserter.InsertLayers(
        this.properLayeredGraph,
        layerArrays,
        this.database,
        this.IntGraph,
      )
      this.properLayeredGraph = t.layeredGraph
      layerArrays = t.la
      this.LayersAreDoubled = true
    } else if (r.multipleEdges) {
      const t = EdgePathsInserter.InsertPaths(
        this.properLayeredGraph,
        layerArrays,
        this.database,
        this.IntGraph,
      )
      this.properLayeredGraph = t.layeredGraph
      layerArrays = t.la
      Assert.assert(layersAreCorrect(layerArrays))
    }

    this.RecreateIntGraphFromDataBase()

    return layerArrays
  }

  RecreateIntGraphFromDataBase() {
    let edges = new Array<PolyIntEdge>()
    for (const list of this.database.Multiedges.values())
      edges = edges.concat(list)
    this.IntGraph.SetEdges(edges, this.IntGraph.nodeCount)
  }

  InsertVirtualEdgesIfNeeded(layerArrays: LayerArrays) {
    if (this.constrainedOrdering != null)
      //if there are constraints we handle multiedges correctly
      return

    // If there are an even number of multi-edges between two nodes then
    //  add a virtual edge in the multi-edge dict to improve the placement, but only in case when the edge goes down only one layer.
    for (const [k, v] of this.database.Multiedges.keyValues())
      if (v.length % 2 == 0 && layerArrays.y[k.x] - 1 == layerArrays.y[k.y]) {
        const e = new GeomEdge(null)
        const newVirtualEdge = new PolyIntEdge(k.x, k.y, e)
        newVirtualEdge.IsVirtualEdge = true
        v.splice(v.length / 2, 0, newVirtualEdge)
        this.IntGraph.addEdge(newVirtualEdge)
      }
  }

  AnalyzeNeedToInsertLayersAndHasMultiedges(
    layerArrays: LayerArrays,
  ): {
    needToInsertLayers: boolean
    multipleEdges: boolean
  } {
    let needToInsertLayers = false
    let multipleEdges = false
    for (const ie of this.IntGraph.edges)
      if (ie.hasLabel && layerArrays.y[ie.source] != layerArrays.y[ie.target]) {
        //if an edge is a flat edge then
        needToInsertLayers = true
        break
      }

    if (needToInsertLayers == false && this.constrainedOrdering == null)
      //if we have constrains the multiple edges have been already represented in layers
      for (const [k, v] of this.database.Multiedges.keyValues())
        if (v.length > 1) {
          multipleEdges = true
          if (layerArrays.y[k.x] - layerArrays.y[k.y] == 1) {
            //there is a multi edge spanning exactly one layer; unfortunately we need to introduce virtual vertices for
            //the edges middle points
            needToInsertLayers = true
            break
          }
        }
    return {
      needToInsertLayers: needToInsertLayers,
      multipleEdges: multipleEdges,
    }
  }

  DecideIfUsingFastXCoordCalculation(layerArrays: LayerArrays) {
    if (layerArrays.x.length >= this.sugiyamaSettings.BrandesThreshold)
      this.Brandes = true
  }

  CalculateAnchorsAndYPositions(layerArrays: LayerArrays) {
    this.anchors = CalculateAnchorSizes(
      this.database,
      this.properLayeredGraph,
      this.originalGraph,
      this.IntGraph,
      this.sugiyamaSettings,
    )
    CalcInitialYAnchorLocations(
      layerArrays,
      500,
      this.originalGraph,
      this.database,
      this.IntGraph,
      this.sugiyamaSettings,
      this.LayersAreDoubled,
    )
  }

  // put some labels to the left of the splines if it makes sense
  OptimizeEdgeLabelsLocations() {
    for (let i = 0; i < this.anchors.length; i++) {
      const a = this.anchors[i]
      if (a.labelIsToTheRightOfTheSpline) {
        //by default the label is put to the right of the spline
        const sp = this.GetSuccessorAndPredecessor(i)
        if (!TryToPutLabelOutsideOfAngle(a, sp.predecessor, sp.successor)) {
          const sumNow =
            sp.predecessor.Origin.sub(a.Origin).length +
            sp.successor.Origin.sub(a.Origin).length
          const nx = a.right - a.leftAnchor //new potential anchor center
          const xy = new Point(nx, a.y)
          const sumWouldBe =
            sp.predecessor.Origin.sub(xy).length +
            sp.successor.Origin.sub(xy).length
          if (sumWouldBe < sumNow)
            //we need to swap
            PutLabelToTheLeft(a)
        }
      }
    }
  }

  GetSuccessorAndPredecessor(
    i: number,
  ): {predecessor: Anchor; successor: Anchor} {
    let predecessor: number
    for (const ie of this.properLayeredGraph.InEdges(i)) predecessor = ie.Source // there will be only one

    let successor: number
    for (const ie of this.properLayeredGraph.OutEdges(i)) successor = ie.Target //there will be only one

    //we compare the sum of length of projections of edges (predecessor,i), (i,successor) to x in cases when the label is to the right and to the left

    return {
      predecessor: this.anchors[predecessor],
      successor: this.anchors[successor],
    }
  }

  CalculateLayerArrays(): LayerArrays {
    const layerArrays = this.CalculateYLayers()

    if (this.constrainedOrdering == null) {
      this.DecideIfUsingFastXCoordCalculation(layerArrays)

      this.CalculateAnchorsAndYPositions(layerArrays)

      if (this.Brandes) this.CalculateXPositionsByBrandes(layerArrays)
      else this.CalculateXLayersByGansnerNorth(layerArrays)
    } else this.anchors = this.database.Anchors

    this.OptimizeEdgeLabelsLocations()

    this.engineLayerArrays = layerArrays
    this.StraightensShortEdges()

    const aspectRatio = this.CalculateOriginalGraphBox()

    if (this.sugiyamaSettings.AspectRatio != 0)
      this.StretchToDesiredAspectRatio(
        aspectRatio,
        this.sugiyamaSettings.AspectRatio,
      )

    return layerArrays
  }

  StretchToDesiredAspectRatio(aspectRatio: number, desiredAR: number) {
    if (aspectRatio > desiredAR) {
      this.StretchInYDirection(aspectRatio / desiredAR)
    } else if (aspectRatio < desiredAR) {
      this.StretchInXDirection(desiredAR / aspectRatio)
    }
  }

  StretchInYDirection(scaleFactor: number) {
    const center: number =
      (this.originalGraph.boundingBox.top +
        this.originalGraph.boundingBox.bottom) /
      2
    for (const a of this.database.Anchors) {
      a.bottomAnchor = a.bottomAnchor * scaleFactor
      a.topAnchor = a.topAnchor * scaleFactor
      a.y = center + scaleFactor * (a.y - center)
    }

    const h = this.originalGraph.height * scaleFactor
    this.originalGraph.boundingBox = new Rectangle({
      left: this.originalGraph.boundingBox.left,
      top: center + h / 2,
      right: this.originalGraph.boundingBox.right,
      bottom: center - h / 2,
    })
  }

  StretchInXDirection(scaleFactor: number) {
    const center: number =
      (this.originalGraph.boundingBox.left +
        this.originalGraph.boundingBox.right) /
      2
    for (const a of this.database.Anchors) {
      a.leftAnchor = a.leftAnchor * scaleFactor
      a.rightAnchor = a.rightAnchor * scaleFactor
      a.x = center + scaleFactor * (a.x - center)
    }

    const w = this.originalGraph.width * scaleFactor
    this.originalGraph.boundingBox = new Rectangle({
      left: center - w / 2,
      top: this.originalGraph.boundingBox.top,
      right: center + w / 2,
      bottom: this.originalGraph.boundingBox.bottom,
    })
  }

  CalculateOriginalGraphBox(): number {
    if (this.anchors.length == 0) return 0
    const box = new Rectangle({
      left: this.anchors[0].left,
      top: this.anchors[0].top,
      right: this.anchors[0].right,
      bottom: this.anchors[0].bottom,
    })
    for (let i = 1; i < this.anchors.length; i++) {
      const a: Anchor = this.anchors[i]
      box.add(a.leftTop)
      box.add(a.rightBottom)
    }

    const delta: number = box.leftTop.sub(box.rightBottom).length / 2
    const del = new Point(delta * -1, delta)
    box.add(box.leftTop.add(del))
    box.add(box.rightBottom.sub(del))
    this.originalGraph.boundingBox = box
    return box.height != 0 ? box.width / box.height : 0
  }

  StraightensShortEdges() {
    // eslint-disable-next-line no-empty
    for (; this.StraightenEdgePaths(); ) {}
  }

  StraightenEdgePaths() {
    let ret = false
    for (const e of this.database.AllIntEdges())
      if (e.LayerSpan == 2)
        ret =
          this.ShiftVertexWithNeighbors(
            e.LayerEdges[0].Source,
            e.LayerEdges[0].Target,
            e.LayerEdges[1].Target,
          ) || ret
    return ret
    //foreach (LayerEdge[][] edgeStrings of this.dataBase.RefinedEdges.Values)
    //    if (edgeStrings[0].length == 2)
    //        foreach (LayerEdge[] edgePath of edgeStrings)
    //            ret = ShiftVertexWithNeighbors(edgePath[0].Source, edgePath[0].Target, edgePath[1].Target) || ret;
    //return ret;
  }
  ShiftVertexWithNeighbors(u: number, i: number, v: number): boolean {
    const upper: Anchor = this.database.Anchors[u]
    const lower: Anchor = this.database.Anchors[v]
    const iAnchor: Anchor = this.database.Anchors[i]
    // calculate the ideal x position for i
    //  (x- upper.x)/(iAnchor.y-upper.y)=(lower.x-upper.x)/(lower.y-upper.y)
    const x: number =
      (iAnchor.y - upper.y) * ((lower.x - upper.x) / (lower.y - upper.y)) +
      upper.x
    const eps = 0.0001
    if (x > iAnchor.x + eps) {
      return this.TryShiftToTheRight(x, i)
    }

    if (x < iAnchor.x - eps) {
      return this.TryShiftToTheLeft(x, i)
    }

    return false
  }

  TryShiftToTheLeft(x: number, v: number): boolean {
    const layer: number[] = this.engineLayerArrays.Layers[
      this.engineLayerArrays.y[v]
    ]
    const vPosition: number = this.engineLayerArrays.x[v]
    if (vPosition > 0) {
      const uAnchor: Anchor = this.database.Anchors[layer[vPosition - 1]]
      const allowedX: number = Math.max(
        uAnchor.right +
          (this.sugiyamaSettings.NodeSeparation +
            this.database.Anchors[v].leftAnchor),
        x,
      )
      if (allowedX < this.database.Anchors[v].x - 1) {
        this.database.Anchors[v].x = allowedX
        return true
      }

      return false
    }

    this.database.Anchors[v].x = x
    return true
  }

  TryShiftToTheRight(x: number, v: number): boolean {
    const layer: number[] = this.engineLayerArrays.Layers[
      this.engineLayerArrays.y[v]
    ]
    const vPosition: number = this.engineLayerArrays.x[v]
    if (vPosition < layer.length - 1) {
      const uAnchor: Anchor = this.database.Anchors[layer[vPosition + 1]]
      const allowedX: number = Math.min(
        uAnchor.left -
          (this.sugiyamaSettings.NodeSeparation -
            this.database.Anchors[v].rightAnchor),
        x,
      )
      if (allowedX > this.database.Anchors[v].x + 1) {
        this.database.Anchors[v].x = allowedX
        return true
      }

      return false
    }
    this.database.Anchors[v].x = x
    return true
  }

  CalculateXLayersByGansnerNorth(layerArrays: LayerArrays) {
    this.xLayoutGraph = this.CreateXLayoutGraph(layerArrays)
    this.CalculateXLayersByGansnerNorthOnProperLayeredGraph()
  }

  CalculateXLayersByGansnerNorthOnProperLayeredGraph() {
    const xLayers = new NetworkSimplex(this.xLayoutGraph, null).GetLayers()

    //TestYXLayers(layerArrays, xLayers);//this will not be called in the release version

    for (let i = 0; i < this.database.Anchors.length; i++)
      this.anchors[i].x = xLayers[i]
  }

  // // <summary>
  // // A quote from Gansner93.
  // // The method involves constructing an auxiliary graph as illustrated in figure 4-2.
  // // This transformation is the graphical analogue of the algebraic
  // // transformation mentioned above for removing the absolute values
  // // from the optimization problem. The nodes of the auxiliary graph G^ are the nodes of
  // // the original graph G plus, for every edge e in G, there is a new node ne.
  // // There are two kinds of edges in G^. One edge class encodes the
  // // cost of the original edges. Every edge e = (u,v) in G is replaced by two edges (ne ,u)
  // // and (ne, v) with d = 0 and w = w(e)W(e). The other class of edges separates nodes in the same layer.
  // // If v is the left neighbor of w, then G^ has an edge f = e(v,w) with d( f ) = r(v,w) and
  // // w( f ) = 0. This edge forces the nodes to be sufficiently
  // // separated but does not affect the cost of the layout.
  CreateXLayoutGraph(layerArrays: LayerArrays): XLayoutGraph {
    let nOfVerts: number = this.properLayeredGraph.NodeCount
    // create edges of XLayoutGraph
    const edges = new Array<PolyIntEdge>()
    for (const e of this.properLayeredGraph.Edges) {
      const n1 = new PolyIntEdge(nOfVerts, e.Source, null)
      const n2 = new PolyIntEdge(nOfVerts, e.Target, null)
      n2.weight = e.Weight
      n1.weight = e.Weight
      n1.separation = 0
      // these edge have 0 separation
      n2.separation = 0
      nOfVerts++
      edges.push(n1)
      edges.push(n2)
    }

    for (const layer of layerArrays.Layers) {
      for (let i = layer.length - 1; i > 0; i--) {
        const source = layer[i]
        const target = layer[i - 1]
        const ie = new PolyIntEdge(source, target, null)
        const sourceAnchor: Anchor = this.database.Anchors[source]
        const targetAnchor: Anchor = this.database.Anchors[target]
        const sep =
          sourceAnchor.leftAnchor +
          (targetAnchor.rightAnchor + this.sugiyamaSettings.NodeSeparation)
        ie.separation = sep + 1
        edges.push(ie)
      }
    }

    const ret = new XLayoutGraph(
      this.IntGraph,
      this.properLayeredGraph,
      layerArrays,
      edges,
      nOfVerts,
    )
    ret.SetEdgeWeights()
    return ret
  }

  CalculateXPositionsByBrandes(layerArrays: LayerArrays) {
    XCoordsWithAlignment.CalculateXCoordinates(
      layerArrays,
      this.properLayeredGraph,
      this.originalGraph.nodeCount,
      this.database.Anchors,
      this.sugiyamaSettings.NodeSeparation,
    )
  }

  GluedDagSkeletonEdges(): PolyIntEdge[] {
    const ret = new IntPairMap<PolyIntEdge>(this.IntGraph.nodeCount)
    for (const [k, v] of this.database.Multiedges.keyValues()) {
      if (k.isDiagonal()) continue
      const e = this.verticalConstraints.gluedIntEdge(v[0])
      if (e.source != e.target) ret.set(e.source, e.target, e)
    }

    const gluedUpDownConstraints = from(
      this.verticalConstraints.gluedUpDownIntConstraints.values(),
    ).select((p) => CreateUpDownConstrainedIntEdge(p, null))
    for (const e of gluedUpDownConstraints) ret.set(e.source, e.target, e)
    return Array.from(ret.values())
  }

  static CalcAnchorsForOriginalNode(
    i: number,
    intGraph: BasicGraph<GeomNode, PolyIntEdge>,
    anchors: Anchor[],
    database: Database,
    settings: SugiyamaLayoutSettings,
  ) {
    const t = {
      leftAnchor: 0,
      rightAnchor: 0,
      topAnchor: 0,
      bottomAnchor: 0,
    }

    //that's what we would have without the label and multiedges

    if (intGraph.nodes != null) {
      const node = intGraph.nodes[i]
      ExtendStandardAnchors(t, node, settings)
    }

    RightAnchorMultiSelfEdges(i, t, database, settings)

    const hw = settings.MinNodeWidth / 2
    if (t.leftAnchor < hw) t.leftAnchor = hw
    if (t.rightAnchor < hw) t.rightAnchor = hw
    const hh = settings.MinNodeHeight / 2

    if (t.topAnchor < hh) t.topAnchor = hh
    if (t.bottomAnchor < hh) t.bottomAnchor = hh

    anchors[i] = Anchor.mkAnchor(
      t.leftAnchor,
      t.rightAnchor,
      t.topAnchor,
      t.bottomAnchor,
      intGraph.nodes[i],
      settings.LabelCornersPreserveCoefficient,
    )

    anchors[i].padding = intGraph.nodes[i].padding
  }

  CreateGluedDagSkeletonForLayering() {
    this.gluedDagSkeletonForLayering = new BasicGraph<GeomNode, PolyIntEdge>(
      this.GluedDagSkeletonEdges(),
      this.originalGraph.nodeCount,
    )
    this.SetGluedEdgesWeights()
  }

  SetGluedEdgesWeights() {
    const gluedPairsToGluedEdge = new IntPairMap<PolyIntEdge>(
      this.IntGraph.nodeCount,
    )
    for (const ie of this.gluedDagSkeletonForLayering.edges)
      gluedPairsToGluedEdge.set(ie.source, ie.target, ie)

    for (const [k, v] of this.database.Multiedges.keyValues())
      if (k.x != k.y) {
        const gluedPair = this.verticalConstraints.gluedIntPair(k)
        if (gluedPair.x == gluedPair.y) continue
        const gluedIntEdge = gluedPairsToGluedEdge.get(gluedPair.x, gluedPair.y)
        for (const ie of v) gluedIntEdge.weight += ie.weight
      }
  }

  GetNodeCountsOfGluedDag(): number[] {
    if (this.verticalConstraints.isEmpty) {
      return new Array<number>(this.IntGraph.nodeCount).fill(1)
    }
    return this.verticalConstraints.getGluedNodeCounts()
  }
}

function SnapDeltaUp(y: number, gridSize: number) {
  if (gridSize == 0) return 0
  // how much to snap?
  const k = Math.floor(y / gridSize)
  const delta = y - k * gridSize
  Assert.assert(delta >= 0 && delta < gridSize)
  if (Math.abs(delta) < 0.0001) {
    // ???
    return 0
  }
  return gridSize - delta
}

function LayerIsOriginal(yLayer: number[], origNodeCount: number): boolean {
  for (const j of yLayer) if (j < origNodeCount) return true
  return false
}

function CalculateAnchorSizes(
  database: Database,
  properLayeredGraph: ProperLayeredGraph,
  originalGraph: GeomGraph,
  intGraph: BasicGraph<GeomNode, PolyIntEdge>,
  settings: SugiyamaLayoutSettings,
): Anchor[] {
  const anchors = (database.Anchors = new Array<Anchor>(
    properLayeredGraph.NodeCount,
  ))

  for (let i = 0; i < anchors.length; i++)
    anchors[i] = new Anchor(settings.LabelCornersPreserveCoefficient)

  //go over the old vertices
  for (let i = 0; i < originalGraph.nodeCount; i++)
    LayeredLayout.CalcAnchorsForOriginalNode(
      i,
      intGraph,
      anchors,
      database,
      settings,
    )

  //go over virtual vertices
  for (const intEdge of database.AllIntEdges())
    if (intEdge.LayerEdges != null) {
      for (const layerEdge of intEdge.LayerEdges) {
        const v = layerEdge.Target
        if (v != intEdge.target) {
          const anchor = anchors[v]
          if (!database.MultipleMiddles.has(v)) {
            anchor.leftAnchor = anchor.rightAnchor = VirtualNodeWidth() / 2.0
            anchor.topAnchor = anchor.bottomAnchor =
              VirtualNodeHeight(settings) / 2.0
          } else {
            anchor.leftAnchor = anchor.rightAnchor = VirtualNodeWidth() * 4
            anchor.topAnchor = anchor.bottomAnchor =
              VirtualNodeHeight(settings) / 2.0
          }
        }
      }
      //fix label vertices
      if (intEdge.hasLabel) {
        const lj = intEdge.LayerEdges[intEdge.LayerEdges.length / 2].Source
        const a = anchors[lj]
        const w = intEdge.labelWidth,
          h = intEdge.labelHeight
        a.rightAnchor = w
        a.leftAnchor = VirtualNodeWidth() * 8

        if (a.topAnchor < h / 2.0) a.topAnchor = a.bottomAnchor = h / 2.0

        a.labelIsToTheRightOfTheSpline = true
      }
    }
  return anchors
}

function VirtualNodeWidth() {
  return 1
}

// the height of dummy nodes
function VirtualNodeHeight(settings: SugiyamaLayoutSettings) {
  return (settings.MinNodeHeight * 1.5) / 8
}

function SetFlatEdgesForLayer(
  database: Database,
  layerArrays: LayerArrays,
  i: number,
  intGraph: BasicGraphOnEdges<PolyIntEdge>,
  settings: SugiyamaLayoutSettings,
  ymax: number,
) {
  let flatEdgesHeight = 0
  if (i > 0) {
    //looking for flat edges on the previous level
    //we stack labels of multiple flat edges on top of each other
    const flatPairs = GetFlatPairs(
      layerArrays.Layers[i - 1],
      layerArrays.y,
      intGraph,
    )
    if (flatPairs.any()) {
      const dyOfFlatEdge = settings.LayerSeparation / 3
      const ym = ymax
      flatEdgesHeight = flatPairs
        .select((pair) =>
          SetFlatEdgesLabelsHeightAndPositionts(
            pair,
            ym,
            dyOfFlatEdge,
            database,
          ),
        )
        .max()
    }
  }
  return flatEdgesHeight
}

// returnst the height of the graph+spaceBeforeMargins
function CalcInitialYAnchorLocations(
  layerArrays: LayerArrays,
  spaceBeforeMargins: number,
  originalGraph: GeomGraph,
  database: Database,
  intGraph: BasicGraphOnEdges<PolyIntEdge>,
  settings: SugiyamaLayoutSettings,
  layersAreDoubled: boolean,
) {
  const anchors = database.Anchors
  let ymax = originalGraph.Margins + spaceBeforeMargins //setting up y coord - going up by y-layers
  let i = 0
  for (const yLayer of layerArrays.Layers) {
    let bottomAnchorMax = 0
    let topAnchorMax = 0
    for (const j of yLayer) {
      const p = anchors[j]
      if (p.bottomAnchor > bottomAnchorMax) bottomAnchorMax = p.bottomAnchor
      if (p.topAnchor > topAnchorMax) topAnchorMax = p.topAnchor
    }
    MakeVirtualNodesTall(
      yLayer,
      bottomAnchorMax,
      topAnchorMax,
      originalGraph.nodeCount,
      database.Anchors,
    )

    const flatEdgesHeight = SetFlatEdgesForLayer(
      database,
      layerArrays,
      i,
      intGraph,
      settings,
      ymax,
    )

    const layerCenter = ymax + bottomAnchorMax + flatEdgesHeight
    let layerTop = layerCenter + topAnchorMax
    if (NeedToSnapTopsToGrid(settings)) {
      layerTop += SnapDeltaUp(layerTop, settings.GridSizeByY)
      for (const j of yLayer) anchors[j].top = layerTop
    } else if (NeedToSnapBottomsToGrid(settings)) {
      let layerBottom = layerCenter - bottomAnchorMax
      layerBottom += SnapDeltaUp(layerBottom, layerBottom)
      for (const j of yLayer) {
        anchors[j].bottom = layerBottom
        layerTop = Math.max(anchors[j].top, layerTop)
      }
    } else for (const j of yLayer) anchors[j].y = layerCenter

    const layerSep = settings.ActualLayerSeparation(layersAreDoubled)
    ymax = layerTop + layerSep
    i++
  }

  // for the last layer
  SetFlatEdgesForLayer(database, layerArrays, i, intGraph, settings, ymax)
}

function CreateUpDownConstrainedIntEdge(
  intPair: IntPair,
  e: GeomEdge,
): PolyIntEdge {
  const intEdge = new PolyIntEdge(intPair.x, intPair.y, e)
  intEdge.weight = 0
  //we do not want the edge weight to contribute in to the sum but just take the constraint into account
  intEdge.separation = 1
  return intEdge
}
function EdgeSpan(layers: number[], e: PolyIntEdge) {
  return layers[e.source] - layers[e.target]
}

function MakeVirtualNodesTall(
  yLayer: number[],
  bottomAnchorMax: number,
  topAnchorMax: number,
  originalNodeCount: number,
  anchors: Anchor[],
) {
  if (LayerIsOriginal(yLayer, originalNodeCount))
    for (const j of yLayer)
      if (j >= originalNodeCount) {
        const p = anchors[j]
        p.bottomAnchor = bottomAnchorMax
        p.topAnchor = topAnchorMax
      }
}

function NeedToSnapTopsToGrid(settings: SugiyamaLayoutSettings) {
  return settings.SnapToGridByY == SnapToGridByY.Top
}

function NeedToSnapBottomsToGrid(settings: SugiyamaLayoutSettings) {
  return settings.SnapToGridByY == SnapToGridByY.Bottom
}

function TryToPutLabelOutsideOfAngle(
  a: Anchor,
  predecessor: Anchor,
  successor: Anchor,
): boolean {
  if (a.labelIsToTheRightOfTheSpline) {
    if (
      Point.getTriangleOrientation(
        predecessor.Origin,
        a.Origin,
        successor.Origin,
      ) == TriangleOrientation.Clockwise
    )
      return true

    const la = a.leftAnchor
    const ra = a.rightAnchor
    const x = a.x
    PutLabelToTheLeft(a)
    if (
      Point.getTriangleOrientation(
        predecessor.Origin,
        a.Origin,
        successor.Origin,
      ) == TriangleOrientation.Counterclockwise
    )
      return true
    a.x = x
    a.leftAnchor = la
    a.rightAnchor = ra
    a.labelIsToTheRightOfTheSpline = true
    a.labelIsToTheLeftOfTheSpline = false
    return false
  }
  return false
}

function PutLabelToTheLeft(a: Anchor) {
  const r = a.right
  const t = a.leftAnchor
  a.leftAnchor = a.rightAnchor
  a.rightAnchor = t
  a.x = r - a.rightAnchor

  a.labelIsToTheLeftOfTheSpline = true
  a.labelIsToTheRightOfTheSpline = false
}

function GetFlatPairs(
  layer: number[],
  layering: number[],
  intGraph: BasicGraphOnEdges<PolyIntEdge>,
): IEnumerable<IntPair> {
  const pairs = new IntPairSet(intGraph.nodeCount)
  for (const v of layer) {
    if (v >= intGraph.nodeCount) continue
    for (const edge of intGraph.outEdges[v])
      if (layering[edge.source] == layering[edge.target])
        pairs.addNN(edge.source, edge.target)
  }

  return from(pairs.values())
}

function SetFlatEdgesLabelsHeightAndPositionts(
  pair: IntPair,
  ymax: number,
  dy: number,
  database: Database,
): number {
  let height = 0

  const list = database.GetMultiedgeI(pair)
  for (const edge of list) {
    height += dy
    const label = edge.edge.label
    if (label != null) {
      label.center = new Point(label.center.x, ymax + height + label.height / 2)
      height += label.height
    }
  }
  return height
}

function ExtendStandardAnchors(
  t: {
    leftAnchor: number
    rightAnchor: number
    topAnchor: number
    bottomAnchor: number
  },
  node: GeomNode,
  settings: SugiyamaLayoutSettings,
) {
  t.rightAnchor = t.leftAnchor = (node.width + settings.GridSizeByX) / 2
  t.topAnchor = t.bottomAnchor = node.height / 2
}

function RightAnchorMultiSelfEdges(
  i: number,
  t: {
    rightAnchor: number
    topAnchor: number
    bottomAnchor: number
  },
  database: Database,
  settings: SugiyamaLayoutSettings,
) {
  const delta = WidthOfSelfEdge(database, i, t, settings)
  t.rightAnchor += delta
}

function WidthOfSelfEdge(
  database: Database,
  i: number,
  t: {
    rightAnchor: number
    topAnchor: number
    bottomAnchor: number
  },
  settings: SugiyamaLayoutSettings,
): number {
  let delta = 0
  const multiedges = database.GetMultiedge(i, i)
  //it could be a multiple self edge
  if (multiedges.length > 0) {
    for (const e of multiedges)
      if (e.edge.label != null) {
        t.rightAnchor += e.edge.label.width
        if (t.topAnchor < e.edge.label.height / 2.0)
          t.topAnchor = t.bottomAnchor = e.edge.label.height / 2.0
      }

    delta +=
      (settings.NodeSeparation + settings.MinNodeWidth) * multiedges.length
  }
  return delta
}

function preRunTransform(geomGraph: GeomGraph, m: PlaneTransformation) {
  if (m.isIdentity()) {
    return
  }

  const matrixInverse = m.inverse()
  for (const n of geomGraph.nodes()) {
    n.transform(matrixInverse)
  }

  // calculate new label widths and heights
  for (const e of geomGraph.edges()) {
    if (e.label != null) {
      const r = Rectangle.mkPP(
        matrixInverse.multiplyPoint(new Point(0, 0)),
        matrixInverse.multiplyPoint(new Point(e.label.width, e.label.height)),
      )
      e.label.width = r.width
      e.label.height = r.height
    }
  }
}

function postRunTransform(
  geometryGraph: GeomGraph,
  transform: PlaneTransformation,
  margins: {left: number; right: number; top: number; bottom: number},
) {
  if (!transform.isIdentity()) return
  for (const n of geometryGraph.nodes()) {
    n.transform(transform)
  }

  // restore labels widths and heights
  for (const e of geometryGraph.edges()) {
    if (e.label != null) {
      const r = Rectangle.mkPP(
        transform.multiplyPoint(new Point(0, 0)),
        transform.multiplyPoint(new Point(e.label.width, e.label.height)),
      )
      e.label.width = r.width
      e.label.height = r.height
    }
  }
  TransformCurves(geometryGraph, transform)
}

function TransformCurves(geometryGraph: GeomGraph, m: PlaneTransformation) {
  for (const e of geometryGraph.edges()) {
    if (e.label != null) {
      e.label.center = m.multiplyPoint(e.label.center)
    }

    TransformEdgeCurve(m, e)
  }
}
function TransformEdgeCurve(transformation: PlaneTransformation, e: GeomEdge) {
  if (e.curve != null) {
    e.curve = e.curve.transform(transformation)
    const eg = e.edgeGeometry
    if (eg.sourceArrowhead != null) {
      eg.sourceArrowhead.tipPosition = transformation.multiplyPoint(
        eg.sourceArrowhead.tipPosition,
      )
    }

    if (eg.targetArrowhead != null) {
      eg.targetArrowhead.tipPosition = transformation.multiplyPoint(
        eg.targetArrowhead.tipPosition,
      )
    }

    TransformUnderlyingPolyline(e, transformation)
  }
}

function TransformUnderlyingPolyline(
  e: GeomEdge,
  transformation: PlaneTransformation,
) {
  if (e.underlyingPolyline != null) {
    for (let s = e.underlyingPolyline.headSite; s != null; s = s.next) {
      s.point = transformation.multiplyPoint(s.point)
    }
  }
}
