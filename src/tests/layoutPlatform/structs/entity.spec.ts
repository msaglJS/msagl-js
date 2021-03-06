import {Node} from './../../../layoutPlatform/structs/node'
import {Graph} from './../../../layoutPlatform/structs/graph'
test('entity graphs', () => {
  const c = new Graph('c')
  const b = new Graph('b')
  const a = new Graph('a')
  c.addNode(b)
  b.addNode(a)
  const bc = Array.from(a.getAncestors())
  expect(bc.length).toBe(2)
  expect(a.isDescendantOf(b) && a.isDescendantOf(c)).toBe(true)
  const e = new Graph('e')
  expect(e.isDescendantOf(b)).toBe(false)
})

test('test attrs', () => {
  const a = new Node('a')
  a.setAttr(2, '2')
  expect(a.getAttr(0)).toBe(null)
  expect(a.getAttr(2)).toBe('2')
})
