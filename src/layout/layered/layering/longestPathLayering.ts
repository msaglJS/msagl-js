import {LayerCalculator} from './layerCalculator'
import {NetworkEdge} from './networkEdge'
import {BasicGraphOnEdges} from './../../../structs/basicGraphOnEdges'
import {TopologicalSort} from './../../../math/graphAlgorithms/topologicalSort'
// Layering the DAG by longest path
export class LongestPathLayering implements LayerCalculator {
  graph: BasicGraphOnEdges<NetworkEdge>

  GetLayers() {
    //sort the vertices in topological order
    const topoOrder = TopologicalSort.getOrderOnGraph(this.graph)
    const layering = new Array<number>(this.graph.NodeCount)

    //going backward from leaves
    let k = this.graph.NodeCount
    while (k-- > 0) {
      const v = topoOrder[k]
      for (const e of this.graph.inEdges[v]) {
        const u = e.source
        const l = layering[v] + e.separation
        if (layering[u] < l) layering[u] = l
      }
    }
    return layering
  }

  constructor(graph: BasicGraphOnEdges<NetworkEdge>) {
    this.graph = graph
  }
}
