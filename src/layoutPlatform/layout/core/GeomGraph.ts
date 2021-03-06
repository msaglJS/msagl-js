import {Graph} from '../../structs/graph'
import {Rectangle, Size} from '../../math/geometry/rectangle'
import {GeomObject} from './geomObject'
import {GeomNode} from './geomNode'
import {GeomEdge} from './geomEdge'
import {PlaneTransformation} from '../../math/geometry/planeTransformation'
import {Node} from '../../structs/node'
import {CurveFactory} from '../../math/geometry/curveFactory'
import {Point} from '../../math/geometry/point'

export class GeomGraph extends GeomNode {
  translate(delta: Point) {
    const m = new PlaneTransformation(1, 0, delta.x, 0, 1, delta.y)
    this.transform(m)
  }
  private _boundingBox: Rectangle
  labelSize: Size
  public get boundingBox(): Rectangle {
    return this.boundaryCurve
      ? this.boundaryCurve.boundingBox
      : this._boundingBox
  }
  public set boundingBox(value: Rectangle) {
    this._boundingBox = value
  }
  isGraph(): boolean {
    return true
  }
  transform(matrix: PlaneTransformation) {
    if (this.boundaryCurve != null)
      this.boundaryCurve = this.boundaryCurve.transform(matrix)

    for (const n of this.shallowNodes()) {
      n.transform(matrix)
    }
    for (const e of this.edges()) {
      e.transform(matrix)
    }
    this.updateBoundingBox()
  }
  *deepNodes(): IterableIterator<GeomNode> {
    for (const n of this.graph.deepNodes) {
      yield (GeomObject.getGeom(n) as unknown) as GeomNode
    }
  }
  setEdge(s: string, t: string): GeomEdge {
    const structEdge = this.graph.setEdge(s, t)
    return new GeomEdge(structEdge)
  }
  setNode(id: string, size: {width: number; height: number}): GeomNode {
    let node = this.graph.findNode(id)
    if (node == null) {
      this.graph.addNode((node = new Node(id)))
    }
    const geomNode = new GeomNode(node)
    geomNode.boundaryCurve = CurveFactory.mkRectangleWithRoundedCorners(
      size.width,
      size.height,
      size.width / 10,
      size.height / 10,
      new Point(0, 0),
    )
    return geomNode
  }
  MinimalWidth = 0
  MinimalHeight = 0
  pumpTheBoxToTheGraphWithMargins(): Rectangle {
    const b = Rectangle.mkEmpty()
    this.pumpTheBoxToTheGraph(b)
    b.pad(this.Margins)
    if (this.MinimalWidth > 0) b.width = Math.max(b.width, this.MinimalWidth)
    if (this.MinimalHeight > 0) {
      b.height = Math.max(b.height, this.MinimalHeight)
    }
    return b
  }

  // Fields which are set by Msagl
  // return the center of the curve bounding box
  get center() {
    return this.boundingBox.center
  }

  set center(value: Point) {
    const del = value.sub(this.center)
    const t = new PlaneTransformation(1, 0, del.x, 0, 1, del.y)
    this.transform(t)
  }
  pumpTheBoxToTheGraph(b: Rectangle) {
    for (const e of this.edges()) {
      if (e.underCollapsedCluster()) continue
      if (e.curve != null) {
        const cb = e.curve.boundingBox
        cb.pad(e.lineWidth)
        b.addRec(cb)
      }
      if (e.label != null) b.addRec(e.label.boundingBox)
    }

    for (const n of this.shallowNodes()) {
      if (n.underCollapsedCluster()) continue
      b.addRec(n.boundingBox)
    }
  }

  get left() {
    return this.boundingBox.left
  }
  get right() {
    return this.boundingBox.right
  }
  get top() {
    return this.boundingBox.top
  }
  get bottom() {
    return this.boundingBox.bottom
  }
  CheckClusterConsistency(): boolean {
    throw new Error('Method not implemented.')
  }
  Margins = 10
  get edgeCount() {
    return this.graph.edgeCount
  }

  *shallowNodes(): IterableIterator<GeomNode> {
    for (const n of this.graph.shallowNodes)
      yield GeomObject.getGeom(n) as GeomNode
  }

  *edges(): IterableIterator<GeomEdge> {
    for (const n of this.graph.edges) yield GeomObject.getGeom(n) as GeomEdge
  }

  static mk(id: string, labelSize: Size): GeomGraph {
    return new GeomGraph(new Graph(id), labelSize)
  }

  constructor(graph: Graph, labelSize: Size) {
    super(graph)
    this.labelSize = labelSize
  }

  get height() {
    return this.boundingBox.height
  }

  get width() {
    return this.boundingBox.width
  }

  get shallowNodeCount() {
    return this.graph.shallowNodeCount
  }

  get graph() {
    return this.attrCont as Graph
  }

  liftNode(n: GeomNode): GeomNode {
    const liftedNode = this.graph.liftNode(n.node)
    return liftedNode ? <GeomNode>GeomObject.getGeom(liftedNode) : null
  }

  findNode(id: string): GeomNode {
    const n = this.graph.findNode(id)
    if (!n) return null
    return <GeomNode>GeomObject.getGeom(n)
  }

  addNode(gn: GeomNode): GeomNode {
    this.graph.addNode(gn.node)
    return gn
  }

  updateBoundingBox() {
    this.boundingBox = Rectangle.mkEmpty()
    let padding = 0
    for (const e of this.graph.edges) {
      const ge = GeomObject.getGeom(e) as GeomEdge
      if (ge.curve == null) continue
      this.boundingBox.addRec(ge.boundingBox)
      padding = Math.max(padding, ge.lineWidth)
    }
    for (const gn of this.shallowNodes()) {
      this.boundingBox.addRec(gn.boundingBox)
      padding = Math.max(padding, gn.padding)
    }
    this.boundingBox.top += this.labelSize.height
    if (this.boundingBox.width < this.labelSize.width) {
      this.boundingBox.width = this.labelSize.width
    }

    this.boundingBox.pad(padding)
  }
}
