﻿var GlobalScale = 1;
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
interface ScaleAble {
	ScaleX(value: number): void;
	ScaleY(value: number): void;
	Rotate(angle: number): void;
	Translate(x: number, y: number): void;
	GetOriginalWidth(): number;
	scaleX: number;
	center: Point;
	points: Point[];
	scaleY: number;
	GetOriginalHeight(): number;
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
	moving: boolean = false;
	scalingX: boolean = false;
	scalingY: boolean = false;
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
		parentElement?.appendChild(group);
	}
	private Transform(e: MouseEvent): void {
		this.TranslateTransform(e);
		this.ScaleXAxes(e);
		this.ScaleYAxes(e);
		this.ScaleAllAxes(e);
	}
	private Reset(): void {
		this.moving = false;
		this.scalingX = false;
		this.scalingY = false;
		this.multiScaling = false;
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
	private ScaleXAxes(e: MouseEvent): void {
		if (this.scalingX) {
			var deltaX = e.offsetX - this.scaleXClickPoint.X;
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
		if (this.scalingY) {
			var deltaY = e.offsetY - this.scaleYClickPoint.Y;
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
		if (this.multiScaling) {
			var deltaY = e.offsetY - this.scaleAllClickPoint.Y;
			this.height += deltaY;
			var deltaX = e.offsetX - this.scaleAllClickPoint.X;
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
		this.translatePoint = element.GetAbsolutePosition();
		this.Refresh();
	}
	public Refresh(): void {
		let scaleX = document.getElementById(this.ScaleX);
		let scaleY = document.getElementById(this.ScaleY);
		let translate = document.getElementById(this.Translate);
		let scale = document.getElementById(this.MultiScale);
		let stroke = document.getElementById(this.Stroke);
		if (this.child) {
			scaleX?.setAttribute("x", (this.child.points[1].X - this.adornerA / 2).toString());
			scale?.setAttribute("x", (this.child.points[2].X - this.adornerA / 2).toString());
			scaleY?.setAttribute("x", (this.child.points[3].X - this.adornerA / 2).toString());
			translate?.setAttribute("x", (this.child.points[0].X - this.adornerA / 2).toString());
			scaleX?.setAttribute("y", (this.child.points[1].Y - this.adornerA / 2).toString());
			translate?.setAttribute("y", (this.child.points[0].Y - this.adornerA / 2).toString());
			scaleY?.setAttribute("y", (this.child.points[3].Y - this.adornerA / 2).toString());
			scale?.setAttribute("y", (this.child.points[2].Y - this.adornerA / 2).toString());
		}

		stroke?.setAttribute("points", `${this.child?.points[0].X},${this.child?.points[0].Y} 
${this.child?.points[1].X},${this.child?.points[1].Y}
${this.child?.points[2].X},${this.child?.points[2].Y}
${this.child?.points[3].X},${this.child?.points[3].Y}`);
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
${GlobalScale * -Math.sin(this.rotateAngle)},
${GlobalScale * Math.cos(this.rotateAngle)},
${this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX},
${this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY})`);
		}
		this.SetPointsToDefault();
		this.TransformPoints();
	}

	private SetCenter(): void {		
		this.center = new Point(0,0);		
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
		const cen = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
		cen.setAttribute("fill", "black");
		cen.setAttribute("rx", "5");
		cen.setAttribute("ry", "5");
		cen.id = "center";
		const parentElement = document.getElementById(parent);
		if (parentElement) {
			parentElement.appendChild(element);
			parentElement.appendChild(cen);
		}
		this.cx = 0;
		this.cy = 0;
		this.offsetX = DefaultA / 2;
		this.offsetY = DefaultA / 2;
		this.width = DefaultA;
		this.height = DefaultA;
		this.fill = "none";
		this.stroke = "black";
		this.strokeWidth = 1;
		this.rotateAngle = Math.PI / 4;
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
		let pos = this.GetAbsolutePosition();
		this.width = DefaultA * value;
		this.scaleX = value * GlobalScale;
		var deltaX = this.width / 2 - (this.cx - pos.X);
		this.offsetX += deltaX;
		this.Refresh();		
	}
	public ScaleY(value: number): void {
		let pos = this.GetAbsolutePosition();
		this.height = DefaultA * value;
		this.scaleY = value * GlobalScale;
		var deltaY = this.height / 2 - (this.cy - pos.Y);
		this.offsetY += deltaY;
		this.Refresh();		
	}
	//angle in degrees
	public Rotate(angle: number): void {
		const angleInRad = Math.PI * angle / 180.0;
		this.rotateAngle = angleInRad;
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
	public GetAbsolutePosition(): Point {
		var x = this.cx - this.width / 2;
		var y = this.cy - this.height / 2;
		return new Point(x, y);
	}
}