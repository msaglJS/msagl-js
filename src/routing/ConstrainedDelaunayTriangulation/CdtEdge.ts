﻿import { String } from 'typescript-string-operations'
import { Assert } from '../../utils/assert'
import { CdtSite } from './CdtSite'
import { CdtTriangle } from './CdtTriangle'

export class CdtEdge {
  public upperSite: CdtSite

  public lowerSite: CdtSite

  ccwTriangle: CdtTriangle

  // in this triangle the edge goes counterclockwise
  cwTriangle: CdtTriangle

  // in this triangle the edge goes clockwise, against the triangle orientation
  //  is an obstacle side, or a given segment
  public Constrained: boolean

  public constructor(a: CdtSite, b: CdtSite) {
    const above = Cdt.Above(a.point, b.point)
    if (above == 1) {
      this.upperSite = a
      this.lowerSite = b
    } else {
      Assert.assert(above != 0)
      this.lowerSite = a
      this.upperSite = b
    }

    this.upperSite.AddEdgeToSite(this)
  }

  //  the amount of free space around the edge
  Capacity = 1000000

  //  the amount of residual free space around the edge
  ResidualCapacity: number
  public get CcwTriangle(): CdtTriangle {
    return this.ccwTriangle
  }
  public set CcwTriangle(value: CdtTriangle) {
    Assert.assert(
      value == null ||
      this.cwTriangle == null ||
      value.OppositeSite(this) != this.cwTriangle.OppositeSite(this),
    )
    this.ccwTriangle = value
  }

  public get CwTriangle(): CdtTriangle {
    return this.cwTriangle
  }
  public set CwTriangle(value: CdtTriangle) {
    Assert.assert(
      value == null ||
      this.ccwTriangle == null ||
      value.OppositeSite(this) != this.ccwTriangle.OppositeSite(this),
    )
    this.cwTriangle = value
  }

  //  returns the trianlge on the edge opposite to the site
  public GetOtherTriangle_c(p: CdtSite): CdtTriangle {
    return this.ccwTriangle
    // TODO: Warning!!!, inline IF is not supported ?
    this.cwTriangle.Contains(p)
    this.cwTriangle
  }

  public IsAdjacent(pi: CdtSite): boolean {
    return pi == this.upperSite || pi == this.lowerSite
  }

  public GetOtherTriangle_T(triangle: CdtTriangle): CdtTriangle {
    return cwTriangle.Contains(p) ? ccwTriangle : cwTriangle
  }

  //  Returns a string that represents the current object.
  //  A string that represents the current object.
  //  <filterpriority>2</filterpriority>
  public /* override */ ToString(): string {
    return String.Format('({0},{1})', this.upperSite, this.lowerSite)
  }

  public OtherSite(site: CdtSite): CdtSite {
    Assert.assert(this.IsAdjacent(site))
    return this.upperSite == site ? this.lowerSite : this.upperSite
  }
}
