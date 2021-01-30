import {Entity} from './../../structs/entity'
import {Cluster} from './../../structs/cluster'
import {from} from 'linq-to-typescript'

test('entity clusters', () => {
  const a = new Entity('a')
  const b = new Cluster('b')
  const c = new Cluster('c')
  a.clusterParent = b
  b.clusterParent = c
  const bc = from(a.allClusterAncestors()).toArray()
  expect(bc.length).toBe(2)
  expect(a.isDescendantOf(b) && a.isDescendantOf(c)).toBe(true)
  const e = new Entity('e')
  expect(e.isDescendantOf(b)).toBe(false)
})

test('test attrs', () => {
  const a = new Entity('a')
  a.setAttr(2, '2')
  expect(a.getAttr(0)).toBe(null)
  expect(a.getAttr(2)).toBe('2')
})