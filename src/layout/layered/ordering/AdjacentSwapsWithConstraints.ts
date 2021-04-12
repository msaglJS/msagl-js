import {LayerArrays} from '../LayerArrays'
import {ProperLayeredGraph} from '../ProperLayeredGraph'
import {ConstrainedOrdering} from './ConstrainedOrdering'
import {LayerInfo} from './LayerInfo'
import {Assert} from './../../../utils/assert'
import {randomInt} from '../../../utils/random'
export class AdjacentSwapsWithConstraints {
  static maxNumberOfAdjacentExchanges = 50

  hasCrossWeights: boolean

  layerInfos: LayerInfo[]

  layering: number[]

  layers: number[][]

  properLayeredGraph: ProperLayeredGraph

  X: number[]

  inCrossingCount: Map<number, number>[]

  outCrossingCount: Map<number, number>[]

  //  for each vertex v let P[v] be the array of predeccessors of v
  P: number[][]

  //  <summary>
  //  The array contains a dictionary per vertex
  //  The value POrder[v][u] gives the offset of u in the array P[v]
  //  </summary>
  POrder: Map<number, number>[]

  //  <summary>
  //  for each vertex v let S[v] be the array of successors of v
  //  </summary>
  S: number[][]

  //  <summary>
  //  The array contains a dictionary per vertex
  //  The value SOrder[v][u] gives the offset of u in the array S[v]
  //  </summary>
  SOrder: Map<number, number>[]

  constructor(
    layerArray: LayerArrays,
    hasCrossWeights: boolean,
    properLayeredGraph: ProperLayeredGraph,
    layerInfos: LayerInfo[],
  ) {
    this.x = layerArray.x
    this.layering = layerArray.y
    this.layers = layerArray.Layers
    this.properLayeredGraph = properLayeredGraph
    this.hasCrossWeights = hasCrossWeights
    this.layerInfos = layerInfos
  }

  //  Gets or sets the number of of passes over all layers to run
  //  adjacent exchanges, where every pass goes
  //  all way up to the top layer and down to the lowest layer
  static get MaxNumberOfAdjacentExchanges(): number {
    return AdjacentSwapsWithConstraints.maxNumberOfAdjacentExchanges
  }

  ExchangeWithGainWithNoDisturbance(layer: number[]): boolean {
    let wasGain = false
    let gain: boolean
    do {
      gain = this.ExchangeWithGain(layer)
      wasGain = wasGain || gain
    } while (gain)

    return wasGain
  }

  CanSwap(i: number, j: number): boolean {
    if (this.IsVirtualNode(i) || this.IsVirtualNode(j)) {
      return true
    }

    const layerInfo: LayerInfo = this.layerInfos[this.layering[i]]
    if (layerInfo == null) {
      return true
    }

    if (
      ConstrainedOrdering.BelongsToNeighbBlock(i, layerInfo) ||
      ConstrainedOrdering.BelongsToNeighbBlock(j, layerInfo) ||
      layerInfo.constrainedFromAbove.has(i) ||
      layerInfo.constrainedFromBelow.has(j)
    ) {
      return false
    }

    if (layerInfo.leftRight.has(i, j)) {
      return false
    }

    return true
  }

  IsVirtualNode(v: number): boolean {
    return this.properLayeredGraph.IsVirtualNode(v)
  }

  // // <summary>
  // // swaps two vertices only if reduces the number of intersections
  // // </summary>
  // // <param name="layer">the layer to work on</param>
  // // <param name="u">left vertex</param>
  // // <param name="v">right vertex</param>
  // // <returns></returns>
  SwapWithGain(u: number, v: number): boolean {
    const gain: number = this.SwapGain(u, v)
    if (gain > 0) {
      this.Swap(u, v)
      return true
    }

    return false
  }

  SwapGain(u: number, v: number): number {
    if (!this.CanSwap(u, v)) {
      return -1
    }

    let t: {cuv: number; cvu: number}
    this.CalcPair(u, v, t)
    return t.cuv - t.cvu
  }

  //  <summary>
  //  calculates the number of intersections between edges adjacent to u and v
  //  </summary>
  //  <param name="u">a vertex</param>
  //  <param name="v">a vertex</param>
  //  <param name="cuv">the result when u is to the left of v</param>
  //  <param name="cvu">the result when v is to the left of u</param>
  CalcPair(u: number, v: number, t: {cuv: number; cvu: number}) {
    const pv = this.P[v]
    const su = this.S[u]
    const sv = this.S[v]
    const pu = this.P[u]
    if (!this.hasCrossWeights) {
      t.cuv = this.CountOnArrays(su, sv) + this.CountOnArrays(pu, pv)
      t.cvu = this.CountOnArrays(sv, su) + this.CountOnArrays(pv, pu)
    } else {
      const uOutCrossCounts = this.outCrossingCount[u]
      const vOutCrossCounts = this.outCrossingCount[v]
      const uInCrossCounts = this.inCrossingCount[u]
      const vInCrossCounts = this.inCrossingCount[v]
      t.cuv =
        this.CountOnArrays_(su, sv, uOutCrossCounts, vOutCrossCounts) +
        this.CountOnArrays_(pu, pv, uInCrossCounts, vInCrossCounts)
      t.cvu =
        this.CountOnArrays_(sv, su, vOutCrossCounts, uOutCrossCounts) +
        this.CountOnArrays_(pv, pu, vInCrossCounts, uInCrossCounts)
    }
  }

  CountOnArrays(unbs: Array<number>, vnbs: Array<number>): number {
    let ret = 0
    const vl: number = vnbs.length - 1
    let j = -1
    // the right most position of vnbs to the left from the current u neighbor
    let vnbsSeenAlready = 0
    for (const uNeighbor of unbs) {
      const xu: number = this.x[uNeighbor]
      for (; j < vl && this.x[vnbs[j + 1]] < xu; j++) {
        vnbsSeenAlready++
      }

      ret = ret + vnbsSeenAlready
    }

    return ret
  }

  //  every inversion between unbs and vnbs gives an intersecton

  //  <param name="unbs">neighbors of u but only from one layer</param>
  //  <param name="vnbs">neighbors of v from the same layers</param>
  //  <returns>number of intersections when u is to the left of v</returns>
  //  <param name="uCrossingCounts"></param>
  //  <param name="vCrossingCount"></param>
  CountOnArrays_(
    unbs: Array<number>,
    vnbs: Array<number>,
    uCrossingCounts: Map<number, number>,
    vCrossingCount: Map<number, number>,
  ): number {
    let ret = 0
    const vl: number = vnbs.length - 1
    let j = -1
    // the right most position of vnbs to the left from the current u neighbor
    let vCrossingNumberSeenAlready = 0
    for (const uNeib of unbs) {
      const xu: number = this.x[uNeib]
      let vnb: number
      for (; j < vl && this.x[(vnb = vnbs[j + 1])] < xu; j++) {
        vCrossingNumberSeenAlready =
          vCrossingNumberSeenAlready + vCrossingCount[vnb]
      }

      ret = ret + vCrossingNumberSeenAlready * uCrossingCounts[uNeib]
    }

    return ret
  }

  // in this routine u and v are adjacent, and u is to the left of v before the swap
  Swap(u: number, v: number) {
    Assert.assert(this.UAndVAreOnSameLayer(u, v))
    Assert.assert(this.UIsToTheLeftOfV(u, v))
    Assert.assert(this.CanSwap(u, v))
    const left: number = this.x[u]
    const right: number = this.x[v]
    const ln: number = this.layering[u]
    // layer number
    const layer: number[] = this.layers[ln]
    layer[left] = v
    layer[right] = u
    this.x[u] = right
    this.x[v] = left
    // update sorted arrays POrders and SOrders
    // an array should be updated only in case it contains both u and v.
    //  More than that, v has to follow u in an the array.
    this.UpdateSsContainingUV(u, v)
    this.UpdatePsContainingUV(u, v)
  }

  ExchangeWithGain(layer: number[]): boolean {
    // find a first pair giving some gain
    for (let i = 0; i < layer.length - 1; i++) {
      if (this.SwapWithGain(layer[i], layer[i + 1])) {
        this.SwapToTheLeft(layer, i)
        this.SwapToTheRight(layer, i + 1)
        return true
      }
    }

    return false
  }

  HeadOfTheCoin(): boolean {
    return randomInt(2) == 0
  }

  DoSwaps() {
    this.InitArrays()
    let count = 0
    let progress = true
    while (
      progress &&
      count++ < AdjacentSwapsWithConstraints.MaxNumberOfAdjacentExchanges
    ) {
      progress = false
      for (let i = 0; i < this.layers.length; i++) {
        progress = this.AdjExchangeLayer(i) || progress
      }

      for (let i: number = this.layers.length - 2; i >= 0; i--) {
        progress = this.AdjExchangeLayer(i) || progress
      }
    }

    Assert.assert(this.SPAreCorrect())
  }

  private SPAreCorrect(): boolean {
    const n: number = this.properLayeredGraph.NodeCount
    for (let i = 0; i < n; i++) {
      if (!this.SIsCorrect(i)) {
        return false
      }
    }

    return true
  }

  private SIsCorrect(i: number): boolean {
    const s = this.S[i]
    const so: Map<number, number> = this.SOrder[i]
    for (let k = 0; k < s.length; k++) {
      const u: number = s[k]
      let uPosition: number
      if ((uPosition = so.get(u)) == null) {
        return false
      }

      if (uPosition != k) {
        return false
      }
    }

    for (let k = 0; k < s.length - 1; k++) {
      const u: number = s[k]
      const v: number = s[k + 1]
      if (!this.UIsToTheLeftOfV(u, v)) {
        return false
      }
    }

    return true
  }

  //  <summary>
  //  Is called just after median layer swap is done
  //  </summary>
  InitArrays() {
    if (this.S == null) {
      this.AllocArrays()
    }

    for (let i = 0; i < this.properLayeredGraph.NodeCount; i++) {
      this.POrder[i].clear()
      this.SOrder[i].clear()
      this.S[i] = []
      this.P[i] = []
    }

    for (let i = 0; i < this.layers.length; i++) {
      this.InitPSArraysForLayer(this.layers[i])
    }
  }

  DisturbLayer(layer: number[]) {
    for (let i = 0; i < layer.length - 1; i++) {
      this.AdjacentSwapToTheRight(layer, i)
    }
  }

  AdjExchangeLayer(i: number): boolean {
    const layer: number[] = this.layers[i]
    const gain: boolean = this.ExchangeWithGainWithNoDisturbance(layer)
    if (gain) {
      return true
    }

    this.DisturbLayer(layer)
    return this.ExchangeWithGainWithNoDisturbance(layer)
  }

  AllocArrays() {
    const n: number = this.properLayeredGraph.NodeCount
    this.P = new Array(n)
    this.S = new Array(n)
    this.POrder = new Array(n)
    this.SOrder = new Array(n)
    if (this.hasCrossWeights) {
      this.outCrossingCount = new Array(n)
      this.inCrossingCount = new Array(n)
    }

    for (let i = 0; i < n; i++) {
      this.P[i] = new Array<number>()
      if (this.hasCrossWeights) {
        let inCounts: Map<number, number>
        for (const le of this.properLayeredGraph.InEdges(i)) {
          inCounts[le.Source] = le.CrossingWeight
        }
      }

      this.POrder[i] = new Map<number, number>()
      this.S[i] = new Array<number>()
      this.SOrder[i] = new Map<number, number>()
      if (this.hasCrossWeights) {
        let outCounts: Map<number, number>
        for (const le of this.properLayeredGraph.OutEdges(i)) {
          outCounts[le.Target] = le.CrossingWeight
        }
      }
    }
  }

  UpdatePsContainingUV(u: number, v: number) {
    if (this.S[u].length <= this.S[v].length) {
      for (const a of this.S[u]) {
        const porder: Map<number, number> = this.POrder[a]
        // of course porder contains u, let us see if it contains v
        if (porder.has(v)) {
          const vOffset: number = porder[v]
          // swap u and v in the array P[coeff]
          const p = this.P[a]
          p[vOffset - 1] = v
          p[vOffset] = u
          // update sorder itself
          porder[v] = vOffset - 1
          porder[u] = vOffset
        }
      }
    } else {
      for (const a of this.S[v]) {
        const porder: Map<number, number> = this.POrder[a]
        // of course porder contains u, let us see if it contains v
        if (porder.has(u)) {
          const vOffset: number = porder[v]
          // swap u and v in the array P[coeff]
          const p = this.P[a]
          p[vOffset - 1] = v
          p[vOffset] = u
          // update sorder itself
          porder[v] = vOffset - 1
          porder[u] = vOffset
        }
      }
    }
  }

  SwapToTheRight(layer: number[], i: number) {
    for (let j: number = i; j < layer.length - 1; j++) {
      this.AdjacentSwapToTheRight(layer, j)
    }
  }

  SwapToTheLeft(layer: number[], i: number) {
    for (let j: number = i - 1; j >= 0; j--) {
      this.AdjacentSwapToTheRight(layer, j)
    }
  }

  //  <summary>
  //  swaps i-th element with i+1
  //  </summary>
  //  <param name="layer">the layer to work on</param>
  //  <param name="i">the position to start</param>
  //  <returns></returns>
  AdjacentSwapToTheRight(layer: number[], i: number) {
    const v: number = layer[i + 1]
    const u: number = layer[i]
    const gain: number = this.SwapGain(u, v)
    if (gain > 0 || (gain == 0 && this.HeadOfTheCoin())) {
      this.Swap(u, v)
      return
    }
  }

  //  <summary>
  //  Sweep layer from left to right and fill S,P arrays as we go.
  //  The arrays P and S will be sorted according to X. Note that we will not keep them sorted
  //  as we doing adjacent swaps. Initial sorting only needed to calculate initial clr,crl values.
  //  </summary>
  //  <param name="layer"></param>
  InitPSArraysForLayer(layer: number[]) {
    for (const l of layer) {
      for (const p of this.properLayeredGraph.Pred(l)) {
        const so: Map<number, number> = this.SOrder[p]
        if (so.has(l)) {
          continue
        }

        const sHasNow: number = so.size
        this.S[p].push(l)
        // l takes the first available slot in S[p]
        so[l] = sHasNow
      }

      for (const s of this.properLayeredGraph.Succ(l)) {
        const po: Map<number, number> = this.POrder[s]
        if (po.has(l)) {
          continue
        }

        const pHasNow: number = po.size
        this.P[s].push(l)
        // l take the first available slot in P[s]
        po[l] = pHasNow
      }
    }
  }

  UpdateSsContainingUV(u: number, v: number) {
    if (this.P[u].length <= this.P[v].length) {
      for (const a of this.P[u]) {
        const sorder: Map<number, number> = this.SOrder[a]
        // of course sorder contains u, let us see if it contains v
        if (sorder.has(v)) {
          const vOffset: number = sorder[v]
          // swap u and v in the array S[coeff]
          const s = this.S[a]
          s[vOffset - 1] = v
          s[vOffset] = u
          // update sorder itself
          sorder[v] = vOffset - 1
          sorder[u] = vOffset
        }
      }
    } else {
      for (const a of this.P[v]) {
        const sorder: Map<number, number> = this.SOrder[a]
        // of course sorder contains u, let us see if it contains v
        if (sorder.has(u)) {
          const vOffset: number = sorder[v]
          // swap u and v in the array S[coeff]
          const s = this.S[a]
          s[vOffset - 1] = v
          s[vOffset] = u
          // update sorder itself
          sorder[v] = vOffset - 1
          sorder[u] = vOffset
        }
      }
    }
  }

  private UAndVAreOnSameLayer(u: number, v: number): boolean {
    return this.layering[u] == this.layering[v]
  }

  private UIsToTheLeftOfV(u: number, v: number): boolean {
    return this.x[u] < this.x[v]
  }
}
