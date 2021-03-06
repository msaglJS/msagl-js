import {RBTree} from './../../../layoutPlatform/structs/RBTree/rbTree'
import {RbTreeUtils} from './../../testUtils/rbTreeUtils'

test('check if has correct in-order-traversal', () => {
  const comparer = (a: number, b: number) => a - b
  const vals: number[] = RbTreeUtils.getRandomArray(10, 100)
  const tree: RBTree<number> = RbTreeUtils.buildTreeWithNums(vals, comparer)

  vals.sort(comparer)
  let i = 0
  for (const node of tree) {
    expect(node).toBe(vals[i]) // 'nodes not in order')
    i++
  }
})
test('check if the iterator works', () => {
  const comparer = (a: number, b: number) => a - b
  const vals = [0, 1, 2]
  const tree: RBTree<number> = RbTreeUtils.buildTreeWithNums(vals, comparer)

  vals.sort(comparer)
  let i = 0
  for (const node of tree) {
    expect(node).toBe(vals[i]) // 'nodes not in order')
    i++
  }
})

test('check black height(s) are equal', () => {
  const comparer = (a: number, b: number) => a - b
  const vals: number[] = RbTreeUtils.getRandomArray(50, 100)
  const tree: RBTree<number> = RbTreeUtils.buildTreeWithNums(vals, comparer)
  const blackHeight = RbTreeUtils.computeBlackHeight(tree.getRoot())
  //  console.log(blackHeight)
  expect(blackHeight != -1).toBe(true)
  //    'difference in black height of left and right branch of a subtree',
})

test('check removal', () => {
  const comparer = (a: number, b: number) => a - b
  const tree: RBTree<number> = new RBTree<number>(comparer)
  for (let i = 1; i <= 20; i++) {
    tree.insert(i)
  }
  tree.remove(10)
  let i = 1
  for (const node of tree) {
    if (i == 10) expect(node).toBe(11) // 'node w/ value 10 not removed')
    i++
  }
})
