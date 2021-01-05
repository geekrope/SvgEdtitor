var GlobalScale = 10;
var GlobalXOffset = 0;
var GlobalYOffset = 0;
var ElementIndex = 0;
var DefaultA = 100;
interface ScaleAble {
	ScaleX(value: number): void;
	ScaleY(value: number): void;
	Rotate(angle: number): void;
}
class TransformGrid {
	readonly RotateGroup: string = "RotateGroup";
	readonly ScaleGroup: string = "ScaleGroup";
	readonly Translate: string = "Translate";
	readonly ScaleX: string = "ScaleX";
	readonly ScaleY: string = "ScaleY";
	readonly MultiScale: string = "MultiScale";
	parent: string;
	adornerA = 10;
	adornerColor = "#404040";
	private CreateAdorner(id: string): SVGRectElement {
		const adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		adorner.setAttribute("width", this.adornerA.toString());
		adorner.setAttribute("height", this.adornerA.toString());
		adorner.setAttribute("fill", this.adornerColor);
		return adorner;
	}
	constructor(parent: string) {
		this.parent = parent;

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
	rotateAngle: number;
	parent: string;
	public Refresh(): void {
		const element = document.getElementById(this.id);
		if (element) {
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
		this.cx = DefaultA / 2;
		this.cy = DefaultA / 2;
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
		this.Refresh();
	}
	public ScaleY(value: number): void {
		this.height *= value;
		this.Refresh();
	}
	//angle in degrees
	public Rotate(angle: number) {
		const angleInRad = Math.PI * angle / 180.0;
		this.rotateAngle = angleInRad;
		this.Refresh();
	}
}