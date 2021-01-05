var GlobalScale = 1;
var GlobalXOffset = 0;
var GlobalYOffset = 0;
var ElementIndex = 0;
var DefaultA = 100;
function assert(condition: any, msg?: string): asserts condition {
	if (!condition) {
		const alert_message = msg ?? "Logic error. If you see this, then something gone wrong way ):";
		console.log(alert_message);
		window.alert(alert_message);
		throw new Error(alert_message);
	}
}
interface ScaleAble {
	ScaleX(value: number): void;
	ScaleY(value: number): void;
	Rotate(angle: number): void;
	Translate(x: number, y: number): void;
	GetWidth(): number;
	scaleX: number;
	scaleY: number;
	GetHeight(): number;
	GetAbsolutePosition(): Point;
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
	readonly MultiScale: string = "MultiScale";
	parent: string;
	translatePoint = new Point(0, 0);
	scaleX = 1;
	scaleY = 1;
	width = 0;
	height = 0;
	strokeWidth = 2;
	moving:boolean = false;
	_translateClickPoint = new Point(0, 0);
	adornerA = 10;
	adornerColor = "#404040";
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
		adorner.setAttribute("fill", this.adornerColor);
		adorner.id = id;
		return adorner;
	}
	constructor(parent: string) {
		this.parent = parent;
		this.child = undefined;
		let translate = this.CreateAdorner(this.Translate);
		const parentElement = document.getElementById(parent);
		translate.addEventListener("mousedown", ((e: MouseEvent) => {
			this.moving = true;
			this.translateClickPoint = new Point(e.offsetX, e.offsetY);
		}).bind(this));
		parentElement?.addEventListener("mousemove", this.Transform.bind(this));
		parentElement?.addEventListener("mouseup", this.Reset.bind(this));
		let scaleX = this.CreateAdorner(this.ScaleX);
		let scaleY = this.CreateAdorner(this.ScaleY);
		let scale = this.CreateAdorner(this.MultiScale);
		let stroke = document.createElementNS("http://www.w3.org/2000/svg", "rect");
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
		parentElement?.appendChild(group);
	}
	private Transform(e: MouseEvent): void {
		this.TranslateTransform(e);
	}
	private Reset():void {
		this.moving = false;
	}
	private TranslateTransform(e: MouseEvent): void {
		if (this.moving) {
			var deltaX = e.offsetX - this.translateClickPoint.X;
			var deltaY = e.offsetY - this.translateClickPoint.Y;
			this.translatePoint.X += deltaX;
			this.translatePoint.Y += deltaY;
			this.translateClickPoint = new Point(e.offsetX, e.offsetY);
			this.child?.Translate(deltaX, deltaY);
			this.Refresh();
		}
	}
	public SetChild(element: ScaleAble): void {
		this.child = element;
		this.width = element.GetWidth() * element.scaleX;
		this.height = element.GetHeight() * element.scaleY;
		this.scaleX = element.scaleX;
		this.scaleY = element.scaleY;
		this.translatePoint = element.GetAbsolutePosition();
		this.Refresh();
	}
	public Refresh(): void {
		let scaleX = document.getElementById(this.ScaleX);
		let scaleY = document.getElementById(this.ScaleY);
		let translate = document.getElementById(this.Translate);
		let scale = document.getElementById(this.MultiScale);
		let stroke = document.getElementById(this.Stroke);
		scaleX?.setAttribute("x", (this.translatePoint.X - this.adornerA / 2 + this.width).toString());
		scale?.setAttribute("x", (this.translatePoint.X - this.adornerA / 2 + this.width).toString());
		scaleY?.setAttribute("x", (this.translatePoint.X - this.adornerA / 2).toString());
		translate?.setAttribute("x", (this.translatePoint.X - this.adornerA / 2).toString());
		scaleX?.setAttribute("y", (this.translatePoint.Y - this.adornerA / 2).toString());
		translate?.setAttribute("y", (this.translatePoint.Y - this.adornerA / 2).toString());
		scaleY?.setAttribute("y", (this.translatePoint.Y - this.adornerA / 2 + this.height).toString());
		scale?.setAttribute("y", (this.translatePoint.Y - this.adornerA / 2 + this.height).toString());

		stroke?.setAttribute("x", (this.translatePoint.X - this.strokeWidth / 2).toString());
		stroke?.setAttribute("y", (this.translatePoint.Y - this.strokeWidth / 2).toString());
		stroke?.setAttribute("width", (this.strokeWidth + this.width).toString());
		stroke?.setAttribute("height", (this.strokeWidth + this.height).toString());
	}
}
class Ellipse implements ScaleAble {
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
	rotateAngle: number;
	parent: string;
	public Refresh(): void {
		const element = document.getElementById(this.id);
		assert(element);
		{
			element.setAttribute("cx", (this.cx + this.strokeWidth / 2 + GlobalXOffset).toString());
			element.setAttribute("cy", (this.cy + this.strokeWidth / 2 + GlobalYOffset).toString());
			element.setAttribute("rx", (this.width / 2).toString());
			element.setAttribute("ry", (this.height / 2).toString());
			element.setAttribute("fill", this.fill);
			element.setAttribute("stroke", this.stroke);
			element.setAttribute("strokeWidth", this.strokeWidth.toString());
			element.setAttribute("transform", `matrix(
${GlobalScale * Math.cos(this.rotateAngle)},
${GlobalScale * Math.sin(this.rotateAngle)},
${GlobalScale * Math.sin(this.rotateAngle)},
${GlobalScale * Math.cos(this.rotateAngle)},
0,
0)`);
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
		this.cx = DefaultA;
		this.cy = DefaultA;
		this.width = DefaultA;
		this.height = DefaultA;
		this.fill = "none";
		this.stroke = "black";
		this.strokeWidth = 1;
		this.rotateAngle = 0;
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
		this.width *= value;
		this.scaleX = value * GlobalScale;
		this.Refresh();
	}
	public ScaleY(value: number): void {
		this.height *= value;
		this.scaleY = value * GlobalScale;
		this.Refresh();
	}
	//angle in degrees
	public Rotate(angle: number): void {
		const angleInRad = Math.PI * angle / 180.0;
		this.rotateAngle = angleInRad;
		this.Refresh();
	}
	public Translate(x: number, y: number): void {
		this.cx += x;
		this.cy += y;
		this.Refresh();
	}
	public GetWidth(): number {
		return DefaultA;
	}
	public GetHeight(): number {
		return DefaultA;
	}
	public GetAbsolutePosition(): Point {
		var x = this.cx - this.width / 2;
		var y = this.cy - this.height / 2;
		return new Point(x, y);
	}
}