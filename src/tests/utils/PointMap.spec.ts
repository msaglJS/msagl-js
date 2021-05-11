import {PointMap} from '../../layoutPlatform/utils/PointMap'

xtest('PointMap', () => {
  const m = new PointMap<number>()
  m.set(0, 0, 0)
  m.set(1.3, 1, 2)
  m.set(2, 2, 4)
  m.set(2, 1.2, 3)

  const p = Array.from(m.keys())
  expect(p.length).toBe(4)
  expect(p[0].y < 3).toBe(true)
  const kv = Array.from(m.keyValues())
  expect(kv[0][1] < 5).toBe(true)
  expect(kv.length == 4).toBe(true)

  m.delete(1.3, 1)
  expect(m.has(1.3, 1)).toBe(false)
  expect(m.has(2, 1.2)).toBe(true)
})
