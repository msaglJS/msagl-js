import {ICurve} from './../../math/geometry/icurve'
import {SmoothedPolyline} from './../../math/geometry/smoothedPolyline'
import {Arrowhead} from './arrowhead'
import {Port} from './port'
export class EdgeGeometry {
  sourcePort: Port
  targetPort: Port
  curve: ICurve
  smoothedPolyline: SmoothedPolyline

  sourceArrowhead: Arrowhead

  targetArrowhead = new Arrowhead()

  lineWidth = 1

  setSmoothedPolylineAndCurve(poly: SmoothedPolyline) {
    this.smoothedPolyline = poly
    this.curve = poly.createCurve()
  }

  /* 
   // <summary>
   //     Translate all the geometries with absolute positions by the specified delta
   // </summary>
   // <param name="delta">vector by which to translate</param>
   public void Translate(Point delta) {
     if (delta.x == 0 && delta.y == 0) return;
     RaiseLayoutChangeEvent(delta);
     if (Curve != null)
       Curve.Translate(delta);
 
     if (SmoothedPolyline != null)
       for (Site s = SmoothedPolyline.HeadSite, s0 = SmoothedPolyline.HeadSite;
         s != null;
     s = s.next, s0 = s0.next)
     s.point = s0.point + delta;
 
     if (SourceArrowhead != null)
       SourceArrowhead.TipPosition += delta;
     if (TargetArrowhead != null)
       TargetArrowhead.TipPosition += delta;
 
   }
 
   internal number GetMaxArrowheadLength() {
   number l = 0;
   if (SourceArrowhead != null)
     l = SourceArrowhead.length;
   if (TargetArrowhead != null && TargetArrowhead.length > l)
     return TargetArrowhead.length;
   return l;
 }
 
 
         // <summary>
         // </summary>
         public event EventHandler < LayoutChangeEventArgs > LayoutChangeEvent;
 
 
         // <summary>
         // </summary>
         // <param name="newValue"></param>
         public void RaiseLayoutChangeEvent(object newValue) {
   if (LayoutChangeEvent != null)
     LayoutChangeEvent(this, new LayoutChangeEventArgs{ DataAfterChange = newValue });
 }
     }
 */
}
