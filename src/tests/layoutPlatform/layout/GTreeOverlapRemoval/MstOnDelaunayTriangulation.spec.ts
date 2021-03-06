import {from} from 'linq-to-typescript'
import {MstOnDelaunayTriangulation} from '../../../../layoutPlatform/layout/GTreeOverlapRemoval/MstOnDelaunayTriangulation'
import {DebugCurve} from '../../../../layoutPlatform/math/geometry/debugCurve'
import {LineSegment} from '../../../../layoutPlatform/math/geometry/lineSegment'
import {Point} from '../../../../layoutPlatform/math/geometry/point'
import {SvgDebugWriter} from '../../../../layoutPlatform/math/geometry/svgDebugWriter'
import {Cdt} from '../../../../layoutPlatform/routing/ConstrainedDelaunayTriangulation/Cdt'
import {CdtSweeper} from '../../../../layoutPlatform/routing/ConstrainedDelaunayTriangulation/CdtSweeper'

test('ienum', () => {
  function* foo() {
    yield 0
  }
  const e = from(foo)
  expect(e.count()).toBe(1)
  expect(e.count()).toBe(1)
})

test('gtree on CDT', () => {
  const count = 100
  const points = []
  for (let i = 0; i < count; i++) {
    points.push(new Point(Math.random(), Math.random()).mul(20))
  }

  const cdt = new Cdt(points, null, null)
  cdt.run()
  const redCurves = []
  for (const s of cdt.PointsToSites.values()) {
    for (const e of s.Edges) {
      if (e.upperSite.point.y < 0 || e.lowerSite.point.y < 0) {
        redCurves.push(LineSegment.mkPP(e.lowerSite.point, e.upperSite.point))
      }
    }
  }
  CdtSweeper.ShowCdt(
    [...cdt.GetTriangles()],
    null,
    from(redCurves),
    null,
    '/tmp/mdsCdt.svg',
  )
  const ret = MstOnDelaunayTriangulation.GetMstOnCdt(
    cdt,
    (e) => e.lowerSite.point.sub(e.upperSite.point).length,
  )
  const l = []
  for (const s of cdt.PointsToSites.values()) {
    for (const e of s.Edges) {
      l.push(
        DebugCurve.mkDebugCurveTWCI(
          50,
          0.1,
          'black',
          LineSegment.mkPP(e.lowerSite.point, e.upperSite.point),
        ),
      )
    }
  }

  for (const e of ret) {
    l.push(
      DebugCurve.mkDebugCurveTWCI(
        100,
        0.2,
        'red',
        LineSegment.mkPP(e.lowerSite.point, e.upperSite.point),
      ),
    )
  }

  SvgDebugWriter.dumpDebugCurves('/tmp/mst.svg', l)
  //          LayoutAlgorithmSettings.ShowDebugCurvesEnumeration(l);
})
