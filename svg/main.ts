var GlobalScale = 1;
var GlobalXOffset = 0;
var GlobalYOffset = 0;
var ElementIndex = 0;
var DefaultA = 100;
function getDistance(p1: Point, p2: Point): number {
	return Math.sqrt((p1.X - p2.X) * (p1.X - p2.X) + (p1.Y - p2.Y) * (p1.Y - p2.Y));
}
function assert(condition: any, msg?: string): asserts condition {
	if (!condition) {
		const alert_message = msg ?? "Logic error. If you see this, then something gone wrong way ):";
		console.log(alert_message);
		window.alert(alert_message);
		throw new Error(alert_message);
	}
}
function getOriginalPoint(mtrx: DOMMatrix, transformed: Point): Point {
	var a = mtrx.a;
	var b = mtrx.b;
	var c = mtrx.c;
	var d = mtrx.d;
	var e = mtrx.e;
	var f = mtrx.f;
	var x1 = transformed.X;
	var y1 = transformed.Y;
	var y = (((b) / a) * x1 - y1 + f - ((b * e) / a)) / ((b * c - d * a) / a);
	var x = (1 / a) * (x1 - c * y - e);
	return new Point(x, y);
}
interface Colored {
	fill: string;
	stroke: string;
	strokeWidth: number;
	Refresh(): void;
}
interface ScaleAble {
	ScaleX(value: number): void;
	ScaleY(value: number): void;
	Rotate(angle: number): void;
	Translate(x: number, y: number): void;
	GetOriginalWidth(): number;
	scaleX: number;
	center: Point;
	rotateAngle: number;
	points: Point[];
	scaleY: number;
	GetOriginalHeight(): number;
	offsetX: number;
	offsetY: number;
}
class Point {
	X: number = 0;
	Y: number = 0;
	constructor(x: number, y: number) {
		this.X = x;
		this.Y = y;
	}
}
class TransformGrid {
	readonly RotateGroup: string = "RotateGroup";
	readonly ScaleGroup: string = "ScaleGroup";
	readonly Translate: string = "Translate";
	readonly ScaleX: string = "ScaleX";
	readonly ScaleY: string = "ScaleY";
	readonly Stroke: string = "Stroke";
	readonly Rotate: string = "Rotate";
	readonly MultiScale: string = "MultiScale";
	parent: string;
	scaleX = 1;
	scaleY = 1;
	width = 0;
	height = 0;
	strokeWidth = 2;
	moving: boolean = false;
	scalingX: boolean = false;
	scalingY: boolean = false;
	rotating: boolean = false;
	multiScaling: boolean = false;
	_translateClickPoint = new Point(0, 0);
	scaleXClickPoint = new Point(0, 0);
	scaleYClickPoint = new Point(0, 0);
	scaleAllClickPoint = new Point(0, 0);
	adornerA = 10;
	adornerColor = "#53b6ee";
	child?: ScaleAble;
	set translateClickPoint(point: Point) {
		this._translateClickPoint = point;
	}
	get translateClickPoint(): Point {
		return this._translateClickPoint;
	}
	private CreateAdorner(id: string): SVGRectElement {
		const adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		adorner.setAttribute("width", this.adornerA.toString());
		adorner.setAttribute("height", this.adornerA.toString());
		adorner.setAttribute("fill", "#ffffff");
		adorner.setAttribute("stroke", this.adornerColor);
		adorner.setAttribute("stroke-width", this.strokeWidth.toString());
		adorner.id = id;
		return adorner;
	}
	constructor(parent: string) {
		this.parent = parent;
		this.child = undefined;
		let translate = this.CreateAdorner(this.Translate);
		let scaleX = this.CreateAdorner(this.ScaleX);
		let scaleY = this.CreateAdorner(this.ScaleY);
		let scale = this.CreateAdorner(this.MultiScale);
		let rotate = this.CreateAdorner(this.Rotate);
		const parentElement = document.getElementById(parent);
		translate.addEventListener("mousedown", ((e: MouseEvent) => {
			this.moving = true;
			this.translateClickPoint = new Point(e.offsetX, e.offsetY);
		}).bind(this));
		scaleX.addEventListener("mousedown", ((e: MouseEvent) => {
			this.scalingX = true;
			this.scaleXClickPoint = new Point(e.offsetX, e.offsetY);
		}).bind(this));
		scaleY.addEventListener("mousedown", ((e: MouseEvent) => {
			this.scalingY = true;
			this.scaleYClickPoint = new Point(e.offsetX, e.offsetY);
		}).bind(this));
		scale.addEventListener("mousedown", ((e: MouseEvent) => {
			this.multiScaling = true;
			this.scaleAllClickPoint = new Point(e.offsetX, e.offsetY);
		}).bind(this));
		rotate.addEventListener("mousedown", ((e: MouseEvent) => {
			this.rotating = true;
		}).bind(this));
		parentElement?.addEventListener("mousemove", this.Transform.bind(this));
		parentElement?.addEventListener("mouseup", this.Reset.bind(this));
		let stroke = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
		stroke.id = this.Stroke;
		stroke.setAttribute("stroke", this.adornerColor);
		stroke.setAttribute("fill", "none");
		stroke.setAttribute("stroke-width", this.strokeWidth.toString());
		var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		group.id = this.ScaleGroup;
		group.appendChild(stroke);
		group.appendChild(translate);
		group.appendChild(scaleX);
		group.appendChild(scaleY);
		group.appendChild(scale);
		group.appendChild(rotate);
		parentElement?.appendChild(group);
	}
	private Transform(e: MouseEvent): void {
		this.TranslateTransform(e);
		this.ScaleXAxes(e);
		this.ScaleYAxes(e);
		this.ScaleAllAxes(e);
		this.RotateTransform(e);
	}

	private Reset(): void {
		this.moving = false;
		this.scalingX = false;
		this.scalingY = false;
		this.multiScaling = false;
		this.rotating = false;
	}
	private TranslateTransform(e: MouseEvent): void {
		if (this.moving) {
			var deltaX = e.offsetX - this.translateClickPoint.X;
			var deltaY = e.offsetY - this.translateClickPoint.Y;
			this.translateClickPoint = new Point(e.offsetX, e.offsetY);
			this.child?.Translate(deltaX, deltaY);
			this.Refresh();
			console.log(this.child?.points[0].X + "," + this.child?.points[0].Y + " " + this.translateClickPoint.X + "," + this.translateClickPoint.Y);
		}
	}
	private RotateTransform(e: MouseEvent): void {
		if (this.rotating && this.child) {
			var angleNew = Math.atan2(e.offsetY - this.child.offsetY, e.offsetX - this.child.offsetX) + Math.PI / 2;
			this.child?.Rotate(angleNew);
			this.Refresh();
		}
	}
	private ScaleXAxes(e: MouseEvent): void {
		if (this.scalingX && this.child) {
			var matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle),
				Math.sin(this.child.rotateAngle),
				-Math.sin(this.child.rotateAngle),
				Math.cos(this.child.rotateAngle),
				0,
				0
			]);
			var point = getOriginalPoint(matrix, new Point(e.offsetX, e.offsetY));
			var scaleXClickPointNew = getOriginalPoint(matrix, this.scaleXClickPoint);
			var deltaX = point.X - scaleXClickPointNew.X;
			this.width += deltaX;
			if (this.child) {
				this.scaleX = this.width / this.child.GetOriginalWidth();
			}
			this.scaleXClickPoint = new Point(e.offsetX, e.offsetY);
			this.child?.ScaleX(this.scaleX);
			this.Refresh();
		}
	}
	private ScaleYAxes(e: MouseEvent): void {
		if (this.scalingY && this.child) {
			var matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle),
				Math.sin(this.child.rotateAngle),
				-Math.sin(this.child.rotateAngle),
				Math.cos(this.child.rotateAngle),
				0,
				0
			]);
			var point = getOriginalPoint(matrix, new Point(e.offsetX, e.offsetY));
			var scaleXClickPointNew = getOriginalPoint(matrix, this.scaleYClickPoint);
			var deltaY = point.Y - scaleXClickPointNew.Y;
			this.height += deltaY;
			if (this.child) {
				this.scaleY = this.height / this.child.GetOriginalHeight();
			}
			this.scaleYClickPoint = new Point(e.offsetX, e.offsetY);
			this.child?.ScaleY(this.scaleY);
			this.Refresh();
		}
	}
	private ScaleAllAxes(e: MouseEvent): void {
		if (this.multiScaling && this.child) {
			var matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle),
				Math.sin(this.child.rotateAngle),
				-Math.sin(this.child.rotateAngle),
				Math.cos(this.child.rotateAngle),
				0,
				0
			]);
			var point = getOriginalPoint(matrix, new Point(e.offsetX, e.offsetY));
			var scaleXClickPointNew = getOriginalPoint(matrix, this.scaleAllClickPoint);
			var deltaY = point.Y - scaleXClickPointNew.Y;
			this.height += deltaY;
			var deltaX = point.X - scaleXClickPointNew.X;
			this.width += deltaX;
			if (this.child) {
				this.scaleY = this.height / this.child.GetOriginalHeight();
				this.scaleX = this.width / this.child.GetOriginalWidth();
			}
			this.scaleAllClickPoint = new Point(e.offsetX, e.offsetY);
			this.child?.ScaleY(this.scaleY);
			this.child?.ScaleX(this.scaleX);
			this.Refresh();
		}
	}
	public SetChild(element: ScaleAble): void {
		this.child = element;
		this.width = element.GetOriginalWidth() * element.scaleX;
		this.height = element.GetOriginalHeight() * element.scaleY;
		this.scaleX = element.scaleX;
		this.scaleY = element.scaleY;
		this.Refresh();
	}
	public Refresh(): void {
		let scaleX = document.getElementById(this.ScaleX);
		let scaleY = document.getElementById(this.ScaleY);
		let translate = document.getElementById(this.Translate);
		let scale = document.getElementById(this.MultiScale);
		let stroke = document.getElementById(this.Stroke);
		let rotate = document.getElementById(this.Rotate);
		if (this.child) {
			let pos = new Point(-DefaultA / 2, -DefaultA / 2);
			var matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle) * this.scaleX,
				Math.sin(this.child.rotateAngle) * this.scaleX,
				-Math.sin(this.child.rotateAngle) * this.scaleY,
				Math.cos(this.child.rotateAngle) * this.scaleY,
				this.child.center.X - (this.child.center.X * Math.cos(this.child.rotateAngle) - this.child.center.Y * Math.sin(this.child.rotateAngle)) + this.child.offsetX,
				this.child.center.Y - (this.child.center.Y * Math.cos(this.child.rotateAngle) + this.child.center.X * Math.sin(this.child.rotateAngle)) + this.child.offsetY
			]);
			var point = new Point(pos.X * matrix.a + pos.Y * matrix.c + matrix.e, pos.X * matrix.b + pos.Y * matrix.d + matrix.f);
			var pointRotated = new Point(point.X + Math.cos(this.child.rotateAngle) * this.width / 2 - this.adornerA / 2, point.Y + Math.sin(this.child.rotateAngle) * this.width / 2 - this.adornerA / 2);
			scaleX?.setAttribute("x", (this.child.points[1].X - this.adornerA / 2).toString());
			scale?.setAttribute("x", (this.child.points[2].X - this.adornerA / 2).toString());
			scaleY?.setAttribute("x", (this.child.points[3].X - this.adornerA / 2).toString());
			translate?.setAttribute("x", (this.child.points[0].X - this.adornerA / 2).toString());

			rotate?.setAttribute("x", (pointRotated.X).toString());

			scaleX?.setAttribute("y", (this.child.points[1].Y - this.adornerA / 2).toString());
			translate?.setAttribute("y", (this.child.points[0].Y - this.adornerA / 2).toString());
			scaleY?.setAttribute("y", (this.child.points[3].Y - this.adornerA / 2).toString());
			scale?.setAttribute("y", (this.child.points[2].Y - this.adornerA / 2).toString());

			rotate?.setAttribute("y", (pointRotated.Y).toString());
		}

		stroke?.setAttribute("points", `${this.child?.points[0].X},${this.child?.points[0].Y} 
${this.child?.points[1].X},${this.child?.points[1].Y}
${this.child?.points[2].X},${this.child?.points[2].Y}
${this.child?.points[3].X},${this.child?.points[3].Y}`);
	}
}
class Ellipse implements ScaleAble, Colored {
	public id: string;
	public cx: number;
	public cy: number;
	public width: number;
	public height: number;
	public fill: string;
	public stroke: string;
	public strokeWidth: number;
	public scaleX = 1;
	public scaleY = 1;
	public offsetX = 0;
	public offsetY = 0;
	rotateAngle: number;
	parent: string;
	public points: Point[] = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
	public center: Point;
	public Refresh(): void {
		const element = document.getElementById(this.id);
		assert(element);
		{
			element.setAttribute("cx", (this.cx).toString());
			element.setAttribute("cy", (this.cy).toString());
			element.setAttribute("rx", (this.width / 2).toString());
			element.setAttribute("ry", (this.height / 2).toString());
			element.setAttribute("fill", this.fill);
			element.setAttribute("stroke", this.stroke);
			element.setAttribute("stroke-width", this.strokeWidth.toString());
			element.setAttribute("transform", `matrix(
${GlobalScale * Math.cos(this.rotateAngle)},
${GlobalScale * Math.sin(this.rotateAngle)},
${GlobalScale * -Math.sin(this.rotateAngle)},
${GlobalScale * Math.cos(this.rotateAngle)},
${this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX},
${this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY})`);
		}
		this.SetPointsToDefault();
		this.TransformPoints();
	}

	private SetCenter(): void {
		this.center = new Point(0, 0);
	}

	private SetPointsToDefault(): void {
		let pos = new Point(-DefaultA / 2, -DefaultA / 2);
		this.points[0] = pos;
		this.points[1] = new Point(pos.X + DefaultA, pos.Y);
		this.points[2] = new Point(pos.X + DefaultA, pos.Y + DefaultA);
		this.points[3] = new Point(pos.X, pos.Y + DefaultA);
	}

	private TransformPoints() {
		let a = Math.cos(this.rotateAngle) * GlobalScale * this.scaleX;
		let b = Math.sin(this.rotateAngle) * GlobalScale * this.scaleX;
		let c = -Math.sin(this.rotateAngle) * GlobalScale * this.scaleY;
		let d = Math.cos(this.rotateAngle) * GlobalScale * this.scaleY;
		let e = this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX;
		let f = this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY;
		for (let index = 0; index < this.points.length; index++) {
			this.points[index] = new Point(this.points[index].X * a + this.points[index].Y * c + e, this.points[index].X * b + this.points[index].Y * d + f);
		}
	}

	constructor(parent: string) {
		this.parent = parent;
		this.id = "el" + ElementIndex;
		const element = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
		element.id = this.id;
		const parentElement = document.getElementById(parent);
		if (parentElement) {
			parentElement.appendChild(element);
		}
		this.cx = 0;
		this.cy = 0;
		this.offsetX = DefaultA;
		this.offsetY = DefaultA;
		this.width = DefaultA;
		this.height = DefaultA;
		this.fill = "none";
		this.stroke = "black";
		this.strokeWidth = 4;
		this.rotateAngle = 0;
		this.center = new Point(this.cx, this.cy);
		this.Refresh();
	}
	public Delete(): void {
		const parentElement = document.getElementById(this.parent);
		const element = document.getElementById(this.id);
		if (element && parentElement) {
			parentElement.removeChild(element);
		}
	}
	public ScaleX(value: number): void {
		let translPoint = this.points[0];
		this.width = DefaultA * value;
		this.scaleX = value * GlobalScale;
		this.SetPointsToDefault();
		this.TransformPoints();
		this.offsetY += translPoint.Y - this.points[0].Y;
		this.offsetX += translPoint.X - this.points[0].X;
		this.Refresh();
	}
	public ScaleY(value: number): void {
		let translPoint = this.points[0];
		this.height = DefaultA * value;
		this.scaleY = value * GlobalScale;
		this.SetPointsToDefault();
		this.TransformPoints();
		this.offsetY += translPoint.Y - this.points[0].Y;
		this.offsetX += translPoint.X - this.points[0].X;
		this.Refresh();
	}
	public Rotate(angle: number): void {
		const angleInRad = angle;
		this.rotateAngle = angleInRad;
		this.SetPointsToDefault();
		this.TransformPoints();
		this.Refresh();
	}
	public Translate(x: number, y: number): void {
		this.offsetX += x;
		this.offsetY += y;
		this.Refresh();
	}
	public GetOriginalWidth(): number {
		return DefaultA;
	}
	public GetOriginalHeight(): number {
		return DefaultA;
	}
}
class Rectangle implements ScaleAble, Colored {
	public id: string;
	public cx: number;
	public cy: number;
	public width: number;
	public height: number;
	public fill: string;
	public stroke: string;
	public strokeWidth: number;
	public scaleX = 1;
	public scaleY = 1;
	public offsetX = 0;
	public offsetY = 0;
	rotateAngle: number;
	parent: string;
	public points: Point[] = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
	public center: Point;
	public Refresh(): void {
		const element = document.getElementById(this.id);
		assert(element);
		{
			element.setAttribute("x", (this.cx).toString());
			element.setAttribute("y", (this.cy).toString());
			element.setAttribute("width", (this.width).toString());
			element.setAttribute("height", (this.height).toString());
			element.setAttribute("fill", this.fill);
			element.setAttribute("stroke", this.stroke);
			element.setAttribute("stroke-width", this.strokeWidth.toString());
			element.style.transform = `matrix(
${GlobalScale * Math.cos(this.rotateAngle)},
${GlobalScale * Math.sin(this.rotateAngle)},
${GlobalScale * -Math.sin(this.rotateAngle)},
${GlobalScale * Math.cos(this.rotateAngle)},
${this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX},
${this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY})`;
		}
		this.SetPointsToDefault();
		this.TransformPoints();
	}

	private SetPointsToDefault(): void {
		let pos = new Point(-DefaultA / 2, -DefaultA / 2);
		this.points[0] = pos;
		this.points[1] = new Point(pos.X + DefaultA, pos.Y);
		this.points[2] = new Point(pos.X + DefaultA, pos.Y + DefaultA);
		this.points[3] = new Point(pos.X, pos.Y + DefaultA);
	}

	private TransformPoints() {
		let a = Math.cos(this.rotateAngle) * GlobalScale * this.scaleX;
		let b = Math.sin(this.rotateAngle) * GlobalScale * this.scaleX;
		let c = -Math.sin(this.rotateAngle) * GlobalScale * this.scaleY;
		let d = Math.cos(this.rotateAngle) * GlobalScale * this.scaleY;
		let e = this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX;
		let f = this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY;
		for (let index = 0; index < this.points.length; index++) {
			this.points[index] = new Point(this.points[index].X * a + this.points[index].Y * c + e, this.points[index].X * b + this.points[index].Y * d + f);
		}
	}

	private SetCenter(): void {
		this.center = new Point(0, 0);
		this.cx = -this.width / 2;
		this.cy = -this.height / 2;
		this.Refresh();
	}

	constructor(parent: string) {
		this.parent = parent;
		this.id = "el" + ElementIndex;
		const element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		element.id = this.id;
		const parentElement = document.getElementById(parent);
		if (parentElement) {
			parentElement.appendChild(element);
		}
		this.cx = 0;
		this.cy = 0;
		this.offsetX = DefaultA;
		this.offsetY = DefaultA;
		this.width = DefaultA;
		this.height = DefaultA;
		this.fill = "none";
		this.stroke = "black";
		this.strokeWidth = 4;
		this.rotateAngle = 0;
		this.center = new Point(0, 0);
		this.SetCenter();
		this.Refresh();
	}
	public Delete(): void {
		const parentElement = document.getElementById(this.parent);
		const element = document.getElementById(this.id);
		if (element && parentElement) {
			parentElement.removeChild(element);
		}
	}
	public ScaleX(value: number): void {
		let translPoint = this.points[0];
		this.width = DefaultA * value;
		this.scaleX = value * GlobalScale;
		this.SetPointsToDefault();
		this.TransformPoints();
		this.offsetY += translPoint.Y - this.points[0].Y;
		this.offsetX += translPoint.X - this.points[0].X;
		this.SetCenter();
		this.Refresh();
	}
	public ScaleY(value: number): void {
		let translPoint = this.points[0];
		this.height = DefaultA * value;
		this.scaleY = value * GlobalScale;
		this.SetPointsToDefault();
		this.TransformPoints();
		this.offsetY += translPoint.Y - this.points[0].Y;
		this.offsetX += translPoint.X - this.points[0].X;
		this.SetCenter();
		this.Refresh();
	}
	public Rotate(angle: number): void {
		const angleInRad = angle;
		this.rotateAngle = angleInRad;
		this.SetPointsToDefault();
		this.TransformPoints();
		this.Refresh();
	}
	public Translate(x: number, y: number): void {
		this.offsetX += x;
		this.offsetY += y;
		this.SetCenter();
		this.Refresh();
	}
	public GetOriginalWidth(): number {
		return DefaultA;
	}
	public GetOriginalHeight(): number {
		return DefaultA;
	}
}
interface Bezier {
	Points: Point[];
}
class QuadraticBezier implements Colored {
	public fill: string;
	public stroke: string;
	public strokeWidth: number;
	public _Points: Point[];
	public id: string;
	parent: string;
	get Points() {
		return this._Points;
	}
	set Points(points: Point[]) {
		if (points.length == 3) {
			this._Points = points;
		}		
	}
	constructor(parent :string) {
		this.parent = parent;
		var parentElement = document.getElementById(parent);
		this.fill = "none";
		this.stroke = "black";
		this.strokeWidth = 4;
		this.id = "el" + ElementIndex;
		this.Points = [new Point(this.strokeWidth / 2, DefaultA + this.strokeWidth / 2), new Point(this.strokeWidth / 2, this.strokeWidth / 2), new Point(DefaultA + this.strokeWidth / 2, this.strokeWidth / 2)];
		this._Points = this.Points;
		var element = document.createElementNS("http://www.w3.org/2000/svg", "path");
		element.id = this.id;
		parentElement?.appendChild(element);
		this.Refresh();
	}
	public Delete(): void {
		const parentElement = document.getElementById(this.parent);
		const element = document.getElementById(this.id);
		if (element && parentElement) {
			parentElement.removeChild(element);
		}
	}
	public Refresh(): void {		
		const element = document.getElementById(this.id);
		element?.setAttribute("d", `M${this.Points[0].X},${this.Points[0].Y} Q${this.Points[1].X},${this.Points[1].Y} ${this.Points[2].X},${this.Points[2].Y}`);
		element?.setAttribute("stroke", this.stroke);
		element?.setAttribute("stroke-width", this.strokeWidth.toString());
		element?.setAttribute("fill", this.fill);
	}
}