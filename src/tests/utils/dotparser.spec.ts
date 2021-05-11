import {Color} from '../../drawing/color'
import {DrawingNode} from '../../drawing/drawingNode'
import {parseDotGraph, parseDotString} from '../../tools/dotparser'
import {readdir} from 'fs'
import {join} from 'path'

test('all gv files list ', () => {
  const list: string[] = [
    'a.gv',
    'abstract.gv',
    'alf.gv',
    'arrows.gv',
    'arrowsize.gv',
    'AvantGarde.gv',
    'awilliams.gv',
    'b.gv',
    'b100.gv',
    'b102.gv',
    'b103.gv',
    'b104.gv',
    'b106.gv',
    'b117.gv',
    'b123.gv',
    'b124.gv',
    'b135.gv',
    'b143.gv',
    'b145.gv',
    'b146.gv',
    'b15.gv',
    'b155.gv',
    'b22.gv',
    'b29.gv',
    'b3.gv',
    'b33.gv',
    'b34.gv',
    'b36.gv',
    'b491.gv',
    'b51.gv',
    'b53.gv',
    'b545.gv',
    'b56.gv',
    'b57.gv',
    'b58.gv',
    'b60.gv',
    'b62.gv',
    'b68.gv',
    'b69.gv',
    'b7.gv',
    'b71.gv',
    'b73.gv',
    'b73a.gv',
    'b76.gv',
    'b77.gv',
    'b786.gv',
    'b79.gv',
    'b80.gv',
    'b80a.gv',
    'b81.gv',
    'b85.gv',
    'b94.gv',
    'b993.gv',
    'bad.gv',
    'badvoro.gv',
    'big.gv',
    'biglabel.gv',
    'Bookman.gv',
    'cairo.gv',
    'center.gv',
    'clover.gv',
    'clust.gv',
    'clust1.gv',
    'clust2.gv',
    'clust3.gv',
    'clust4.gv',
    'clust5.gv',
    'clusters.gv',
    'clustlabel.gv',
    'color.gv',
    'colors.gv',
    'colorscheme.gv',
    'compound.gv',
    'Courier.gv',
    'crazy.gv',
    'ctext.gv',
    'd.gv',
    'dd.gv',
    'decorate.gv',
    'dfa.gv',
    'dir.gv',
    'dpd.gv',
    'edgeclip.gv',
    'ER.gv',
    'fdp.gv',
    'fig6.gv',
    'flatedge.gv',
    'fsm.gv',
    'grammar.gv',
    'grdangles.gv',
    'grdcluster.gv',
    'grdcolors.gv',
    'grdfillcolor.gv',
    'grdlinear.gv',
    'grdlinear_angle.gv',
    'grdlinear_node.gv',
    'grdradial.gv',
    'grdradial_angle.gv',
    'grdradial_node.gv',
    'grdshapes.gv',
    'hashtable.gv',
    'Heawood.gv',
    'Helvetica.gv',
    'honda - tokoro.gv',
    'html.gv',
    'html2.gv',
    'in.gv',
    'inv_inv.gv',
    'inv_nul.gv',
    'inv_val.gv',
    'japanese.gv',
    'jcctree.gv',
    'jsort.gv',
    'KW91.gv',
    'labelclust - fbc.gv',
    'labelclust - fbd.gv',
    'labelclust - fbl.gv',
    'labelclust - fbr.gv',
    'labelclust - fdc.gv',
    'labelclust - fdd.gv',
    'labelclust - fdl.gv',
    'labelclust - fdr.gv',
    'labelclust - ftc.gv',
    'labelclust - ftd.gv',
    'labelclust - ftl.gv',
    'labelclust - ftr.gv',
    'labelclust - nbc.gv',
    'labelclust - nbd.gv',
    'labelclust - nbl.gv',
    'labelclust - nbr.gv',
    'labelclust - ndc.gv',
    'labelclust - ndd.gv',
    'labelclust - ndl.gv',
    'labelclust - ndr.gv',
    'labelclust - ntc.gv',
    'labelclust - ntd.gv',
    'labelclust - ntl.gv',
    'labelclust - ntr.gv',
    'labelroot - fbc.gv',
    'labelroot - fbd.gv',
    'labelroot - fbl.gv',
    'labelroot - fbr.gv',
    'labelroot - fdc.gv',
    'labelroot - fdd.gv',
    'labelroot - fdl.gv',
    'labelroot - fdr.gv',
    'labelroot - ftc.gv',
    'labelroot - ftd.gv',
    'labelroot - ftl.gv',
    'labelroot - ftr.gv',
    'labelroot - nbc.gv',
    'labelroot - nbd.gv',
    'labelroot - nbl.gv',
    'labelroot - nbr.gv',
    'labelroot - ndc.gv',
    'labelroot - ndd.gv',
    'labelroot - ndl.gv',
    'labelroot - ndr.gv',
    'labelroot - ntc.gv',
    'labelroot - ntd.gv',
    'labelroot - ntl.gv',
    'labelroot - ntr.gv',
    'Latin1.gv',
    'layer.gv',
    'layer2.gv',
    'layers.gv',
    'ldbxtried.gv',
    'longflat.gv',
    'lsunix1.gv',
    'lsunix2.gv',
    'lsunix3.gv',
    'mike.gv',
    'mode.gv',
    'multi.gv',
    'NaN.gv',
    'nestedclust.gv',
    'newarrows.gv',
    'NewCenturySchlbk.gv',
    'ngk10_4.gv',
    'nhg.gv',
    'nojustify.gv',
    'nul_inv.gv',
    'nul_nul.gv',
    'nul_val.gv',
    'ordering.gv',
    'overlap.gv',
    'p.gv',
    'p2.gv',
    'p3.gv',
    'p4.gv',
    'pack.gv',
    'Palatino.gv',
    'Petersen.gv',
    'pgram.gv',
    'pm2way.gv',
    'pmpipe.gv',
    'polypoly.gv',
    'ports.gv',
    'proc3d.gv',
    'process.gv',
    'ps.gv',
    'ps_user_shapes.gv',
    'pslib.gv',
    'rd_rules.gv',
    'record.gv',
    'record2.gv',
    'records.gv',
    'root.gv',
    'rootlabel.gv',
    'rowcolsep.gv',
    'rowe.gv',
    'russian.gv',
    'sb_box.gv',
    'sb_box_dbl.gv',
    'sb_circle.gv',
    'sb_circle_dbl.gv',
    'shapes.gv',
    'shells.gv',
    'sides.gv',
    'size.gv',
    'sl_box.gv',
    'sl_box_dbl.gv',
    'sl_circle.gv',
    'sl_circle_dbl.gv',
    'sq_rules.gv',
    'sr_box.gv',
    'sr_box_dbl.gv',
    'sr_circle.gv',
    'sr_circle_dbl.gv',
    'st_box.gv',
    'st_box_dbl.gv',
    'st_circle.gv',
    'st_circle_dbl.gv',
    'states.gv',
    'structs.gv',
    'style.gv',
    'Symbol.gv',
    'Times.gv',
    'train11.gv',
    'trapeziumlr.gv',
    'tree.gv',
    'triedds.gv',
    'try.gv',
    'unix.gv',
    'unix2.gv',
    'unix2k.gv',
    'url.gv',
    'user_shapes.gv',
    'val_inv.gv',
    'val_nul.gv',
    'val_val.gv',
    'viewfile.gv',
    'viewport.gv',
    'weight.gv',
    'world.gv',
    'xlabels.gv',
    'xx.gv',
    'ZapfChancery.gv',
    'ZapfDingbats.gv',
  ]
  const path = 'src/tests/data/graphvis/'
  for (const f of list) {
    if (f.match('big(.*).gv')) continue
    console.log(f)
    const g = parseDotGraph(join(path, f))
    expect(g != null).toBe(true)
  }
})
xtest('all gv files', () => {
  const path = 'src/tests/data/graphvis/'
  readdir(path, (err, files) => {
    expect(err).toBe(null)
    for (const f of files) {
      if (!f.match('(.*).gv')) continue
      if (f.match('big.gv')) continue

      const g = parseDotGraph(join(path, f))
      expect(g != null).toBe(true)
    }
  })
})

xtest('dot parser', () => {
  const g = parseDotGraph('src/tests/data/graphvis/clust4.gv')
  expect(g == null).toBe(false)
})

xtest('dot parser big.gv', () => {
  const g = parseDotGraph('src/tests/data/graphvis/big.gv')
  expect(g == null).toBe(false)
})

xtest('parse with colors ', () => {
  const dotString =
    'digraph G {\n' +
    'node [style=filled, shape=box]\n' +
    'ddddddd [fontcolor=yellow, fillcolor=blue, color=orange]\n' +
    'subgraph clusterA {\n' +
    '  style=filled\n' +
    '  fillcolor=lightgray\n' +
    'pencolor=blue\n' +
    'eeeee [peripheries=3, fontcolor=red, color=yellow]\n' +
    'eeeee -> ee\n' +
    '}\n' +
    'ddddddd -> eeeee [labelfontcolor=chocolate, headlabel=headlabel, label=flue, fontcolor=green, color=lightblue]\n' +
    '}'
  const drawingGraph = parseDotString(dotString)
  expect(drawingGraph != null).toBe(true)
  const ddNode: DrawingNode = drawingGraph.findNode('ddddddd')
  expect(ddNode != null).toBe(true)
  expect(ddNode.node.id).toBe('ddddddd')
  expect(Color.equal(ddNode.color, Color.Orange)).toBe(true)
})
