var GlobalScale = 1;
var GlobalXOffset = 0;
var GlobalYOffset = 0;
var ElementIndex = 0;
var DefaultA = 100;
var Elements: UIElement[] = [];
var SelectedElement: UIElement;
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
	let a = mtrx.a;
	let b = mtrx.b;
	let c = mtrx.c;
	let d = mtrx.d;
	let e = mtrx.e;
	let f = mtrx.f;
	let x1 = transformed.X;
	let y1 = transformed.Y;
	let y = (((b) / a) * x1 - y1 + f - ((b * e) / a)) / ((b * c - d * a) / a);
	let x = (1 / a) * (x1 - c * y - e);
	return new Point(x, y);
}
interface SelectionDelegate {
	(element: UIElement): void;
}
interface UIElement {
	fill: string;
	stroke: string;
	strokeWidth: number;
	Refresh(): void;
	Delete(): void;
	HideAdorners(): void;
	ShowAdorners(): void;
	OnSelected: SelectionDelegate;
}
interface DynamicEditable {
	AddPoint(point: Point): void;
	ClosePath(): void;
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
		let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
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
			let deltaX = e.offsetX - this.translateClickPoint.X;
			let deltaY = e.offsetY - this.translateClickPoint.Y;
			this.translateClickPoint = new Point(e.offsetX, e.offsetY);
			this.child?.Translate(deltaX, deltaY);
			this.Refresh();			
		}
	}
	private RotateTransform(e: MouseEvent): void {
		if (this.rotating && this.child) {
			let angleNew = Math.atan2(e.offsetY - this.child.offsetY, e.offsetX - this.child.offsetX) + Math.PI / 2;
			this.child?.Rotate(angleNew);
			this.Refresh();
		}
	}
	private ScaleXAxes(e: MouseEvent): void {
		if (this.scalingX && this.child) {
			let matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle),
				Math.sin(this.child.rotateAngle),
				-Math.sin(this.child.rotateAngle),
				Math.cos(this.child.rotateAngle),
				0,
				0
			]);
			let point = getOriginalPoint(matrix, new Point(e.offsetX, e.offsetY));
			let scaleXClickPointNew = getOriginalPoint(matrix, this.scaleXClickPoint);
			let deltaX = point.X - scaleXClickPointNew.X;
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
			let matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle),
				Math.sin(this.child.rotateAngle),
				-Math.sin(this.child.rotateAngle),
				Math.cos(this.child.rotateAngle),
				0,
				0
			]);
			let point = getOriginalPoint(matrix, new Point(e.offsetX, e.offsetY));
			let scaleXClickPointNew = getOriginalPoint(matrix, this.scaleYClickPoint);
			let deltaY = point.Y - scaleXClickPointNew.Y;
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
			let matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle),
				Math.sin(this.child.rotateAngle),
				-Math.sin(this.child.rotateAngle),
				Math.cos(this.child.rotateAngle),
				0,
				0
			]);
			let point = getOriginalPoint(matrix, new Point(e.offsetX, e.offsetY));
			let scaleXClickPointNew = getOriginalPoint(matrix, this.scaleAllClickPoint);
			let deltaY = point.Y - scaleXClickPointNew.Y;
			this.height += deltaY;
			let deltaX = point.X - scaleXClickPointNew.X;
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
	public SetChild(element: ScaleAble|null): void {
		if (!element) {
			let group = document.getElementById(this.ScaleGroup);
			if (group) {
				group.style.display = "none";
			}
			return;
		}
		else {
			let group = document.getElementById(this.ScaleGroup);
			if (group) {
				group.style.display = "inline";
			}
			var parentElement = document.getElementById(this.parent);
			if (parentElement && group) {
				parentElement.removeChild(group);
				parentElement.appendChild(group);
			}
		}		
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
			let matrix = new DOMMatrix([
				Math.cos(this.child.rotateAngle) * this.scaleX,
				Math.sin(this.child.rotateAngle) * this.scaleX,
				-Math.sin(this.child.rotateAngle) * this.scaleY,
				Math.cos(this.child.rotateAngle) * this.scaleY,
				this.child.center.X - (this.child.center.X * Math.cos(this.child.rotateAngle) - this.child.center.Y * Math.sin(this.child.rotateAngle)) + this.child.offsetX,
				this.child.center.Y - (this.child.center.Y * Math.cos(this.child.rotateAngle) + this.child.center.X * Math.sin(this.child.rotateAngle)) + this.child.offsetY
			]);
			let point = new Point(pos.X * matrix.a + pos.Y * matrix.c + matrix.e, pos.X * matrix.b + pos.Y * matrix.d + matrix.f);
			let pointRotated = new Point(point.X + Math.cos(this.child.rotateAngle) * this.width / 2 - this.adornerA / 2, point.Y + Math.sin(this.child.rotateAngle) * this.width / 2 - this.adornerA / 2);
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
var MainGrid: TransformGrid;
class Ellipse implements ScaleAble, UIElement {
	public readonly id: string;
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
	public OnSelected: SelectionDelegate;
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

	public HideAdorners(): void {
		MainGrid.SetChild(null);
	}
	public ShowAdorners(): void {
		MainGrid.SetChild(this);
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
		ElementIndex++;
		this.OnSelected = (element: UIElement) => { };
		element.addEventListener("mousedown", ((e: MouseEvent) => { this.OnSelected(this) }).bind(this));
	}
	public Delete(): void {
		this.HideAdorners();
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
class Rectangle implements ScaleAble, UIElement {
	public readonly id: string;
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
	public OnSelected: SelectionDelegate;
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

	public HideAdorners(): void {
		MainGrid.SetChild(null);
	}
	public ShowAdorners(): void {
		MainGrid.SetChild(this);
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
		ElementIndex++;
		this.OnSelected = (element: UIElement) => { };
		element.addEventListener("mousedown", ((e: MouseEvent) => { this.OnSelected(this) }).bind(this));
	}
	public Delete(): void {
		this.HideAdorners();
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
enum BezierType {
	quadratic, cubic
}
class BezierSegment implements UIElement, Bezier {
	public fill: string;
	public stroke: string;
	public strokeWidth: number;
	public _Points: Point[];
	public readonly id: string;
	AdonerGroupId: string;
	AdonerPoints: Point[] = [];
	AdonerMove: boolean[] = [];
	Type: BezierType;
	StrokePolyline: string;
	adornerA = 10;
	adornerColor = "#53b6ee";
	parent: string;
	public OnSelected: SelectionDelegate;
	Adorners: string[];
	get Points() {
		return this._Points;
	}
	set Points(points: Point[]) {
		if (points.length == 3 && this.Type as BezierType == BezierType.quadratic) {
			this._Points = points;
		}
		if (points.length == 4 && this.Type as BezierType == BezierType.cubic) {
			this._Points = points;
		}
	}

	private CreateAdorner(id: string): SVGRectElement {
		const adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		adorner.setAttribute("width", this.adornerA.toString());
		adorner.setAttribute("height", this.adornerA.toString());
		adorner.setAttribute("fill", "#ffffff");
		adorner.setAttribute("stroke", this.adornerColor);
		adorner.setAttribute("stroke-width", "2");
		adorner.id = id;
		return adorner;
	}

	private CreateAdoners() {
		let group = document.getElementById(this.AdonerGroupId);
		let parentElement = document.getElementById(this.parent);
		if (group && parentElement) {
			for (let index = 0; index < this.Points.length; index++) {
				let adonerId = this.id + "_BezierAdorner_" + index;
				let adorner = this.CreateAdorner(adonerId);
				group.appendChild(adorner);
				this.Adorners[index] = adonerId;
				adorner.addEventListener("mousedown", ((e: MouseEvent) => {
					if (e.target) {
						let target = (<SVGRectElement>e.target).id;
						let split = target.toString().split("_");
						let index = Number.parseInt(split[split.length - 1]);
						this.AdonerPoints[index] = new Point(e.offsetX, e.offsetY);
						this.AdonerMove[index] = true;

					}
				}).bind(this));
			}

			parentElement.addEventListener("mousemove", ((e: MouseEvent) => {
				let index = 0;
				for (let i = 0; i < this.AdonerMove.length; i++) {
					if (this.AdonerMove[i]) {
						index = i;
						break;
					}
				}
				if (this.AdonerMove[index]) {
					this.Points[index].X += e.offsetX - this.AdonerPoints[index].X;
					this.Points[index].Y += e.offsetY - this.AdonerPoints[index].Y;
					this.AdonerPoints[index] = new Point(e.offsetX, e.offsetY);
				}
				this.Refresh();

			}).bind(this));

			parentElement.addEventListener("mouseup", ((e: MouseEvent) => {
				for (let index = 0; index < this.AdonerMove.length; index++) {
					this.AdonerMove[index] = false;
				}
			}).bind(this));
		}
	}

	private ArrayToString(points: Point[]): string {
		let str = "";
		for (let index = 0; index < points.length; index++) {
			str += `${points[index].X},${points[index].Y} `;
		}
		return str;
	}

	constructor(parent: string, type: BezierType) {
		this.parent = parent;
		this.Type = type;
		let parentElement = document.getElementById(parent);
		this.fill = "none";
		this.stroke = "black";
		this.strokeWidth = 4;
		this.id = "el" + ElementIndex;
		this.AdonerGroupId = this.id + "_AdornerGroup";
		if (type as BezierType == BezierType.quadratic) {
			this.Points = [new Point(this.strokeWidth / 2 + DefaultA, DefaultA * 2 + this.strokeWidth / 2), new Point(this.strokeWidth / 2 + DefaultA, this.strokeWidth / 2 + DefaultA), new Point(DefaultA * 2 + this.strokeWidth / 2, this.strokeWidth / 2 + DefaultA)];
		}
		if (type as BezierType == BezierType.cubic) {
			this.Points = [new Point(this.strokeWidth / 2 + DefaultA, DefaultA * 2 + this.strokeWidth / 2), new Point(this.strokeWidth / 2 + DefaultA, this.strokeWidth / 2 + DefaultA), new Point(DefaultA * 2 + this.strokeWidth / 2, this.strokeWidth / 2 + DefaultA), new Point(DefaultA * 2 + this.strokeWidth / 2, this.strokeWidth / 2)];
		}
		this._Points = this.Points;
		let element = document.createElementNS("http://www.w3.org/2000/svg", "path");
		element.id = this.id;
		parentElement?.appendChild(element);
		let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		group.id = this.AdonerGroupId;
		parentElement?.appendChild(group);
		this.Adorners = [];
		this.StrokePolyline = this.id + "_Polyline";
		let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
		polyline.setAttribute("stroke", this.adornerColor /*"#808080"*/);
		polyline.setAttribute("stroke-width", "2");
		polyline.setAttribute("fill", "none");
		polyline.id = this.StrokePolyline;
		group.appendChild(polyline);
		this.CreateAdoners();
		this.Refresh();
		ElementIndex++;
		this.OnSelected = (element: UIElement) => { };
		element.addEventListener("mousedown", ((e: MouseEvent) => { this.OnSelected(this) }).bind(this));
	}
	public Refresh(): void {
		const element = document.getElementById(this.id);
		if (this.Type as BezierType == BezierType.quadratic) {
			element?.setAttribute("d", `M${this.Points[0].X},${this.Points[0].Y} Q${this.Points[1].X},${this.Points[1].Y} ${this.Points[2].X},${this.Points[2].Y}`);
		}
		if (this.Type as BezierType == BezierType.cubic) {
			element?.setAttribute("d", `M${this.Points[0].X},${this.Points[0].Y} C${this.Points[1].X},${this.Points[1].Y} ${this.Points[2].X},${this.Points[2].Y} ${this.Points[3].X},${this.Points[3].Y}`);
		}
		element?.setAttribute("stroke", this.stroke);
		element?.setAttribute("stroke-width", this.strokeWidth.toString());
		element?.setAttribute("fill", this.fill);
		for (let index = 0; index < this.Points.length; index++) {
			let adorner = document.getElementById(this.Adorners[index]);
			if (adorner) {
				adorner.setAttribute("x", (this.Points[index].X - this.adornerA / 2).toString());
				adorner.setAttribute("y", (this.Points[index].Y - this.adornerA / 2).toString());
			}
		}
		const stroke = document.getElementById(this.StrokePolyline);
		stroke?.setAttribute("points", this.ArrayToString(this.Points));
	}

	public Delete(): void {
		const parentElement = document.getElementById(this.parent);
		const element = document.getElementById(this.id);
		const group = document.getElementById(this.AdonerGroupId);
		const poly = document.getElementById(this.StrokePolyline);
		if (element && parentElement && group && poly) {
			parentElement.removeChild(element);
			parentElement.removeChild(group);
			parentElement.removeChild(poly);
		}
	}
	public HideAdorners(): void {
		const group = document.getElementById(this.AdonerGroupId);
		if (group && closed) {
			group.style.display = "none";
		}
	}
	public ShowAdorners(): void {
		const group = document.getElementById(this.AdonerGroupId);
		if (group && closed) {
			group.style.display = "inline";
		}
	}
}
class Polyline implements DynamicEditable, UIElement {
	parent: string;
	public fill: string = "none";
	public stroke: string = "black";
	public strokeWidth: number = 4;
	Points: Point[] = [];
	public readonly id: string;
	AdonerGroupId: string;
	AdonerPoints: Point[] = [];
	AdonerMove: boolean[] = [];
	Adorners: string[] = [];
	adornerA = 10;
	adornerColor = "#53b6ee";
	public OnSelected: SelectionDelegate;
	closed = false;
	closedPolyline = false;
	public smooth = false;
	private CreateAdorner(id: string): SVGRectElement {
		const adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		adorner.setAttribute("width", this.adornerA.toString());
		adorner.setAttribute("height", this.adornerA.toString());
		adorner.setAttribute("fill", "#ffffff");
		adorner.setAttribute("stroke", this.adornerColor);
		adorner.setAttribute("stroke-width", "2");
		adorner.id = id;
		return adorner;
	}

	constructor(parent: string) {
		this.parent = parent;
		this.id = "el" + ElementIndex;
		this.AdonerGroupId = this.id + "_AdornerGroup";
		let parentElement = document.getElementById(parent);
		let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
		group.id = this.AdonerGroupId;
		let polyline = document.createElementNS("http://www.w3.org/2000/svg", "path");
		polyline.id = this.id;
		parentElement?.appendChild(polyline);
		parentElement?.appendChild(group);
		parentElement?.addEventListener("mousedown", (e: MouseEvent) => { this.AddPoint(new Point(e.offsetX, e.offsetY)) });
		ElementIndex++;
		this.smooth = true;
		this.OnSelected = (element: UIElement) => { };
		polyline.addEventListener("mousedown", ((e: MouseEvent) => { this.OnSelected(this) }).bind(this));
	}

	private CheckCollision(adornerPoint: Point, point: Point): boolean {
		let adornerX = adornerPoint.X - this.adornerA / 2;
		let adornerY = adornerPoint.Y - this.adornerA / 2;
		let adornerX2 = adornerPoint.X + this.adornerA / 2;
		let adornerY2 = adornerPoint.Y + this.adornerA / 2;
		return (adornerX < point.X && adornerX2 > point.X && adornerY < point.Y && adornerY2 > point.Y);
	}

	public AddPoint(point: Point): void {
		if (!this.closed) {
			if (this.Points.length >= 2) {
				let collison1 = this.CheckCollision(this.Points[0], point);
				let collison2 = this.CheckCollision(this.Points[this.Points.length - 1], point);
				if (collison1) {
					this.closedPolyline = true;
					this.Refresh();
					this.ClosePath();
					return;
				}
				if (collison2) {
					this.ClosePath();
					return;
				}
			}
			this.Points.push(point);
			let adornerId = this.id + "_Adorner_" + (this.Points.length - 1);
			let adorner = this.CreateAdorner(adornerId);
			adorner.setAttribute("x", (point.X - this.adornerA / 2).toString());
			adorner.setAttribute("y", (point.Y - this.adornerA / 2).toString());
			this.AdonerMove.push(false);
			this.Adorners.push(adornerId);
			this.AdonerPoints.push(new Point(0, 0));
			let group = document.getElementById(this.AdonerGroupId);
			group?.appendChild(adorner);
			this.Refresh();
		}
	}

	private GetBezierMidPoint(p1: Point, p3: Point, intersection: Point): Point {
		var t = 0.5;
		var x = (intersection.X - Math.pow((1 - t), 2) * p1.X - t * t * p3.X) / (2 * (1 - t) * t);
		var y = (intersection.Y - Math.pow((1 - t), 2) * p1.Y - t * t * p3.Y) / (2 * (1 - t) * t);
		return new Point(x, y);
	}

	private ArrayToString(points: Point[]): string {
		let str = "";
		if (!this.smooth) {
			if (points.length >= 1) {
				str = `M${points[0].X},${points[0].Y}`;
				for (let index = 1; index < points.length; index++) {
					str += `L${points[index].X},${points[index].Y}`;
				}
				if (this.closedPolyline) {
					str += `L${points[0].X},${points[0].Y}`;
				}
			}
		}
		else {
			if (points.length >= 1) {
				str = `M${points[0].X},${points[0].Y}`;		
				if (this.closedPolyline) {
					points.push(points[0]);
				}
				for (let index = 0; index < points.length; index+=2) {
					if (index + 2 < points.length) {
						
						var point = this.GetBezierMidPoint(points[index], points[index + 2], points[index + 1]);
						str += `Q${point.X},${point.Y} ${points[index + 2].X},${points[index + 2].Y}`;						
					}
					else {
						str += `L${points[points.length - 1].X},${points[points.length - 1].Y}`;
						break;
					}					
				}				
			}
		}
		return str;
	}

	public ClosePath(): void {
		let parentElement = document.getElementById(this.parent);
		this.closed = true;
		for (let index = 0; index < this.Adorners.length; index++) {
			var element = document.getElementById(this.Adorners[index]);
			if (element) {
				element.addEventListener("mousedown", ((e: MouseEvent) => {
					if (e.target) {
						let target = (<SVGRectElement>e.target).id;
						let split = target.toString().split("_");
						let index = Number.parseInt(split[split.length - 1]);
						this.AdonerPoints[index] = new Point(e.offsetX, e.offsetY);
						this.AdonerMove[index] = true;

					}
				}).bind(this));
			}
		}
		if (parentElement) {
			parentElement.addEventListener("mousemove", ((e: MouseEvent) => {
				let index = 0;
				for (let i = 0; i < this.AdonerMove.length; i++) {
					if (this.AdonerMove[i]) {
						index = i;
						break;
					}
				}
				if (this.AdonerMove[index]) {
					this.Points[index].X += e.offsetX - this.AdonerPoints[index].X;
					this.Points[index].Y += e.offsetY - this.AdonerPoints[index].Y;
					this.AdonerPoints[index] = new Point(e.offsetX, e.offsetY);
				}
				this.Refresh();

			}).bind(this));

			parentElement.addEventListener("mouseup", ((e: MouseEvent) => {
				for (let index = 0; index < this.AdonerMove.length; index++) {
					this.AdonerMove[index] = false;
				}
			}).bind(this));
		}
	}

	public Refresh() {
		const element = document.getElementById(this.id);
		element?.setAttribute("stroke", this.stroke);
		element?.setAttribute("stroke-width", this.strokeWidth.toString());
		element?.setAttribute("fill", this.fill);
		element?.setAttribute("d", this.ArrayToString(this.Points));
		element?.setAttribute("stroke-linejoin", "round");
		element?.setAttribute("stroke-linecap", "round");
		for (let index = 0; index < this.Points.length; index++) {
			let adorner = document.getElementById(this.Adorners[index]);
			if (adorner) {
				adorner.setAttribute("x", (this.Points[index].X - this.adornerA / 2).toString());
				adorner.setAttribute("y", (this.Points[index].Y - this.adornerA / 2).toString());
			}
		}
	}

	public Delete(): void {
		const parentElement = document.getElementById(this.parent);
		const element = document.getElementById(this.id);
		const group = document.getElementById(this.AdonerGroupId);
		if (element && parentElement && group) {
			parentElement.removeChild(element);
			parentElement.removeChild(group);
		}
	}

	public HideAdorners(): void {
		const group = document.getElementById(this.AdonerGroupId);
		if (group&&this.closed) {
			group.style.display = "none";
		}
	}
	public ShowAdorners(): void {
		const group = document.getElementById(this.AdonerGroupId);
		if (group && this.closed) {
			group.style.display = "inline";
		}
	}
}

function ResizeResult() {
	var svg = document.getElementById("parent");
	var size = document.getElementById("result")?.getBoundingClientRect();
	if (svg) {
		svg.setAttribute("viewBox", "0,0," + size?.width+"," + size?.height);
	}
}

function Start() {
	MainGrid = new TransformGrid('parent');
	ResizeResult();
}

function DeselectAll() {
	for (let index: number = 0; index < Elements.length; index++) {
		var el = <UIElement>Elements[index];
		el.HideAdorners();
	}
}

function SelectElement(element: UIElement) {	
	DeselectAll();
	element.ShowAdorners();
}

function CreateEllipse() {
	DeselectAll();
	var el = new Ellipse('parent');
	SelectedElement = el;
	MainGrid.SetChild(el);
	Elements.push(el);
	el.OnSelected = (element: UIElement) => { SelectElement(element); SelectedElement = element; };
}
function CreateRectangle() {
	DeselectAll();
	var el = new Rectangle('parent');
	SelectedElement = el;
	MainGrid.SetChild(el);
	Elements.push(el);
	el.OnSelected = (element: UIElement) => { SelectElement(element); SelectedElement = element; };
}
function CreatePolyline() {
	DeselectAll();
	var el = new Polyline('parent');
	SelectedElement = el;
	el.smooth = false;
	Elements.push(el);
	el.OnSelected = (element: UIElement) => { SelectElement(element); SelectedElement = element; };
}
function CreateQuadraticBezier() {
	DeselectAll();
	var el = new BezierSegment('parent', BezierType.quadratic); 
	SelectedElement = el;
	Elements.push(el);
	el.OnSelected = (element: UIElement) => { SelectElement(element); SelectedElement = element; };
}
function CreateCubicBezier() {
	DeselectAll();
	var el = new BezierSegment('parent', BezierType.cubic);
	SelectedElement = el;
	Elements.push(el);
	el.OnSelected = (element: UIElement) => { SelectElement(element); SelectedElement = element; };
}
function CreateSmoothPath() {
	DeselectAll();
	var el = new Polyline('parent');
	el.smooth = true;
	SelectedElement = el;
	Elements.push(el);
	el.OnSelected = (element: UIElement) => { SelectElement(element); SelectedElement = element; };
}

function ChangeSelectedElementProperties() {
	if (SelectedElement) {
		var strokeColorPicker = <HTMLInputElement>document.getElementById("setBrushColorInp");
		var fillColorPicker = <HTMLInputElement>document.getElementById("setFillColorInp");
		var weight = <HTMLInputElement>document.getElementById("setWeightInp");
		SelectedElement.stroke = strokeColorPicker?.value;
		SelectedElement.fill = fillColorPicker?.value;
		SelectedElement.strokeWidth = Number.parseFloat(weight?.value);
		SelectedElement.Refresh();
	}	
}
