import {PolyIntEdge} from './polyIntEdge'
import {IEdge} from '../../structs/iedge'
import {IntPairMap} from '../../utils/IntPairMap'
import {IntPair} from '../../utils/IntPair'
import {Anchor} from './anchor'

export class Database {
  Anchors: Anchor[]
  multiedges: IntPairMap<PolyIntEdge[]>

  addFeedbackSet(feedbackSet: IEdge[]) {
    for (const e of feedbackSet) {
      const ip = new IntPair(e.source, e.target)
      const ipr = new IntPair(e.target, e.source)

      //we shuffle reversed edges into the other multiedge
      const listToShuffle = this.multiedges.get(ip.x, ip.y)
      for (const er of listToShuffle) er.reverse()

      if (this.multiedges.has(ipr.x, ipr.y)) {
        const m = this.multiedges.get(ipr.x, ipr.y)
        for (const e of listToShuffle) m.push(e)
      } else {
        this.multiedges.set(ipr.x, ipr.y, listToShuffle)
      }

      this.multiedges.delete(ip.x, ip.y)
    }
  }
  constructor(n: number) {
    this.multiedges = new IntPairMap(n)
  }
  registerOriginalEdgeInMultiedges(edge: PolyIntEdge) {
    let o = this.multiedges.get(edge.source, edge.target)
    if (o == null) {
      this.multiedges.set(edge.source, edge.target, (o = []))
    } else {
      console.log(o)
    }

    o.push(edge)
  }

  *SkeletonEdges(): IterableIterator<PolyIntEdge> {
    for (const kv of this.multiedges.keyValues()) {
      if (kv[0].x != kv[0].y) yield kv[1][0]
    }
  }
}
