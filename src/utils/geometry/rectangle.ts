import { Point } from "./point"

class Size {
    width: number;
    height: number;
    constructor(width: number, height: number) {
        this.width = width; this.height = height;
    }
}




export class Rectangle {
    left: number;
    right: number;
    top: number;
    bottom: number;

    constructor(
        left: number,
        right: number,
        top: number,
        bottom: number
    ) {
        this.left = left; this.right = right; this.top = top; this.bottom = bottom
    }
    // returns true if r intersect this rectangle
    Intersects(rectangle: Rectangle): Boolean {
        return this.IntersectsOnX(rectangle) && this.IntersectsOnY(rectangle);
    }

    // intersection (possibly empty) of rectangles
    Intersection(rectangle: Rectangle): Rectangle {
        if (!this.Intersects(rectangle)) {
            let intersection = Rectangle.CreateEmptyRectangle();
            intersection.SetToEmpty();
            return intersection;
        }
        let l = Math.max(this.Left, rectangle.Left);
        let r = Math.min(this.Right, rectangle.Right);
        let b = Math.max(this.Bottom, rectangle.Bottom);
        let t = Math.min(this.Top, rectangle.Top);
        return new Rectangle(l, b, r, t);
    }

    // the center of the bounding box
    get Center(): Point { return this.LeftTop.add(this.RightBottom).mult(0.5); }
    set Center(value: Point) {
        let shift = value.minus(this.Center);
        this.LeftTop = this.LeftTop.add(shift);
        this.RightBottom = this.RightBottom.add(shift);
    }

    IntersectsOnY(r: Rectangle): Boolean {
        if (r.bottom > this.top + Point.distanceEpsilon)
            return false;

        if (r.top < this.bottom - Point.distanceEpsilon)
            return false;

        return true;
    }

    IntersectsOnX(r: Rectangle): Boolean {
        if (r.Left > this.right + Point.distanceEpsilon)
            return false;

        if (r.Right < this.left - Point.distanceEpsilon)
            return false;

        return true;
    }


    // creates an empty rectangle
    static CreateEmptyRectangle() {
        return new Rectangle(0, 0, -1, -1);
    }

    get Left() { return this.left; }
    set Left(value: number) { this.left = value; }

    get Right() { return this.right; }
    set Right(value: number) { this.right = value; }

    get Top() { return this.top; }
    set Top(value: number) { this.top = value; }

    get Bottom() { return this.bottom; }
    set Bottom(value: number) { this.bottom = value; }

    get LeftBottom() { return new Point(this.left, this.bottom); }
    set LeftBottom(value) { this.left = value.x; this.bottom = value.y; }

    get RightTop() { return new Point(this.right, this.top); }
    set RightTop(value) { this.right = value.x; this.top = value.y; }

    get LeftTop() { return new Point(this.left, this.top); }
    set LeftTop(value: Point) { this.left = value.x; this.top = value.y; }


    get RightBottom() { return new Point(this.right, this.bottom); }
    set RightBottom(value) { this.right = value.x; this.bottom = value.y; }


    // create a box of two points
    static rectanglePointPoint(point0: Point, point1: Point) {
        let r = new Rectangle(point0.x, point0.y, point0.x, point0.x);
        r.Add(point1);
        return r;
    }

    // create rectangle from a point
    static RectanglePoint(point: Point) {
        return new Rectangle(point.x, point.y, point.x, point.x);
    }

    static RectangleFromLeftBottomAndSize(left: number, bottom: number, sizeF: Point) {
        let right = left + sizeF.x;
        let top = bottom + sizeF.y;
        return new Rectangle(left, right, top, bottom);
    }

    // create a box on points (x0,y0), (x1,y1)
    static getRectangleOnCoords(x0: number, y0: number, x1: number, y1: number) {
        let r = new Rectangle(x0, y0, x1, y1)
        r.Add(new Point(x1, y1));
        return r;
    }

    // Create rectangle that is the bounding box of the given points
    static RectangleOnPoints(points: [Point]): Rectangle {
        let r = Rectangle.CreateEmptyRectangle()
        for (var p of points) {
            r.Add(p);
        }
        return r;
    }

    // Create rectangle that is the bounding box of the given Rectangles
    static RectangleOnRectangles(rectangles: [Rectangle]) {
        let r = Rectangle.CreateEmptyRectangle()
        for (var p of rectangles) {
            r.AddRec(p);
        }
        return r;
    }

    // the width of the rectangle
    get Width() { return this.right - this.left; }
    set Width(value: number) {
        let hw = value / 2.0;
        let cx = (this.left + this.right) / 2.0;
        this.left = cx - hw;
        this.right = cx + hw;
    }


    // returns true if the rectangle has negative width
    IsEmpty(): Boolean { return this.Width < 0; }

    // makes the rectangle empty
    SetToEmpty() { this.Left = 0; this.Right = -1; }


    // Height of the rectangle
    get Height() { return this.top - this.bottom; }
    set Height(value) {
        let hw = value / 2.0;
        let cx = (this.top + this.bottom) / 2.0;
        this.top = cx + hw;
        this.bottom = cx - hw;
    }


    // rectangle containing both a and b
    static RectangleOfTwo(a: Rectangle, b: Rectangle) {
        let r = new Rectangle(a.left, a.right, a.top, a.bottom);
        r.AddRec(b);
        return r;
    }

    // contains with padding
    ContainsWithPadding(point: Point, padding: number): Boolean {
        return this.left - padding - Point.distanceEpsilon <= point.x && point.x <= this.right + padding + Point.distanceEpsilon &&
            this.bottom - padding - Point.distanceEpsilon <= point.y && point.y <= this.top + padding + Point.distanceEpsilon;
    }

    // Rectangle area
    Area() { return (this.right - this.left) * (this.top - this.bottom); }


    // adding a point to the rectangle
    Add(point: Point) {
        if (!this.IsEmpty) {
            if (this.left > point.x)
                this.left = point.x;

            if (this.top < point.y)
                this.top = point.y;

            if (this.right < point.x)
                this.right = point.x;

            if (this.bottom > point.y)
                this.bottom = point.y;
        } else {
            this.left = this.right = point.x;
            this.top = this.bottom = point.y;
        }
    }

    // extend the box to keep the point.
    // Assume here that the box is initialized correctly
    AddWithCheck(point: Point): Boolean {
        var wider: boolean;
        if (wider = (point.x < this.left))
            this.left = point.x;
        else if (wider = (this.right < point.x))
            this.right = point.x;

        var higher: boolean;

        if (higher = (point.y > this.top))
            this.top = point.y;
        else if (higher = (this.bottom > point.y))
            this.bottom = point.y;

        return wider || higher;
    }

    // adding rectangle
    AddRec(rectangle: Rectangle) {
        this.Add(rectangle.LeftTop);
        this.Add(rectangle.RightBottom);
    }

    // Return copy of specified rectangle translated by the specified delta
    static Translate(rectangle: Rectangle, delta: Point): Rectangle {
        let r = rectangle.Clone();
        r.Center = rectangle.Center.add(delta);
        return r;
    }

    // returns true if the rectangle contains the point
    Contains(point: Point): Boolean {
        return this.ContainsWithPadding(point, 0);
    }

    // returns true if this rectangle completely contains the specified rectangle
    ContainsRect(rect: Rectangle): Boolean {
        return this.Contains(rect.LeftTop) && this.Contains(rect.RightBottom);
    }


    // return the length of the diagonal 
    Diagonal() { return Math.sqrt(this.Width * this.Width + this.Height * this.Height); }


    // pad the rectangle horizontally by the given padding
    PadWidth(padding: number) {
        this.Left -= padding;
        this.Right += padding;
    }

    // pad the rectangle vertically by the given padding
    PadHeight(padding: number) {
        this.Top += padding;
        this.Bottom -= padding;
    }

    // pad the rectangle by the given padding
    Pad(padding: number) {
        if (padding < -this.Width / 2)
            padding = -this.Width / 2;
        if (padding < -this.Height / 2)
            padding = -this.Height / 2;
        this.PadWidth(padding);
        this.PadHeight(padding);
    }

    // Pad the rectangle by the given amount on each side
    PadEverywhere(left: number, bottom: number, right: number, top: number) {
        this.Left -= left;
        this.Right += right;
        this.Bottom -= bottom;
        this.Top += top;
    }

    // Returns the intersection of two rectangles.
    static Intersect(rect1: Rectangle, rect2: Rectangle): Rectangle {
        if (rect1.Intersects(rect2))
            return Rectangle.rectanglePointPoint(
                new Point(Math.max(rect1.Left, rect2.Left), Math.max(rect1.Bottom, rect2.Bottom)),
                new Point(Math.min(rect1.Right, rect2.Right), Math.min(rect1.Top, rect2.Top)));
        return Rectangle.CreateEmptyRectangle();
    }

    /*
    public Polyline Perimeter() {
        var poly = new Polyline();
        poly.AddPoint(LeftTop);
        poly.AddPoint(RightTop);
        poly.AddPoint(RightBottom);
        poly.AddPoint(LeftBottom);
        poly.Closed = true;
        return poly;
    }
*/
    ScaleAroundCenter(scale: number) {
        this.Width = this.Width * scale;
        this.Height = this.Height * scale;
    }

    Clone(): Rectangle {
        return Rectangle.rectanglePointPoint(this.LeftTop, this.RightBottom);
    }



    // gets or sets the Size

    get Size(): Size { return new Size(this.Width, this.Height); }
    set Size(value: Size) {
        this.Width = value.width; this.Height = value.height;
    }

    // constructor with Size and center
    static creatRectangleWithSize(size: Size, center: Point) {
        var w = size.width / 2;
        let left = center.x - w;
        let right = center.x + w;
        var h = size.height / 2;
        let bottom = center.y - h;
        let top = center.y + h;
        return new Rectangle(left, right, top, bottom);
    }

    // adding a point with a Size
    AddPointWithSize(size: Size, point: Point) {
        let w = size.width / 2;
        let h = size.height / 2;

        this.Add(new Point(point.x - w, point.y - h));
        this.Add(new Point(point.x + w, point.y - h));
        this.Add(new Point(point.x - w, point.y + h));
        this.Add(new Point(point.x + w, point.y + h));
    }
}
