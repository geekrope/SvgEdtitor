"use strict";
var GlobalScale = 1;
var GlobalXOffset = 0;
var GlobalYOffset = 0;
var ElementIndex = 0;
var DefaultA = 100;
var Elements = [];
var SelectedElement;
var CurrentDynamicPath;
function getDistance(p1, p2) {
    return Math.sqrt((p1.X - p2.X) * (p1.X - p2.X) + (p1.Y - p2.Y) * (p1.Y - p2.Y));
}
function assert(condition, msg) {
    if (!condition) {
        var alert_message = msg !== null && msg !== void 0 ? msg : "Logic error. If you see this, then something gone wrong way ):";
        console.log(alert_message);
        window.alert(alert_message);
        throw new Error(alert_message);
    }
}
function getOriginalPoint(mtrx, transformed) {
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
var Point = (function () {
    function Point(x, y) {
        this.X = 0;
        this.Y = 0;
        this.X = x;
        this.Y = y;
    }
    return Point;
}());
var TransformGrid = (function () {
    function TransformGrid(parent) {
        var _this = this;
        this.ScaleGroup = "ScaleGroup";
        this.Translate = "Translate";
        this.ScaleX = "ScaleX";
        this.ScaleY = "ScaleY";
        this.Stroke = "Stroke";
        this.Rotate = "Rotate";
        this.MultiScale = "MultiScale";
        this.scaleX = 1;
        this.scaleY = 1;
        this.width = 0;
        this.height = 0;
        this.strokeWidth = 2;
        this.moving = false;
        this.scalingX = false;
        this.scalingY = false;
        this.rotating = false;
        this.multiScaling = false;
        this._translateClickPoint = new Point(0, 0);
        this.scaleXClickPoint = new Point(0, 0);
        this.scaleYClickPoint = new Point(0, 0);
        this.scaleAllClickPoint = new Point(0, 0);
        this.adornerA = 10;
        this.adornerColor = "#53b6ee";
        this.parent = parent;
        this.child = undefined;
        var translate = this.CreateAdorner(this.Translate);
        var scaleX = this.CreateAdorner(this.ScaleX);
        var scaleY = this.CreateAdorner(this.ScaleY);
        var scale = this.CreateAdorner(this.MultiScale);
        var rotate = this.CreateAdorner(this.Rotate);
        var parentElement = document.getElementById(parent);
        translate.addEventListener("mousedown", (function (e) {
            _this.moving = true;
            _this.translateClickPoint = new Point(e.offsetX, e.offsetY);
        }).bind(this));
        scaleX.addEventListener("mousedown", (function (e) {
            _this.scalingX = true;
            _this.scaleXClickPoint = new Point(e.offsetX, e.offsetY);
        }).bind(this));
        scaleY.addEventListener("mousedown", (function (e) {
            _this.scalingY = true;
            _this.scaleYClickPoint = new Point(e.offsetX, e.offsetY);
        }).bind(this));
        scale.addEventListener("mousedown", (function (e) {
            _this.multiScaling = true;
            _this.scaleAllClickPoint = new Point(e.offsetX, e.offsetY);
        }).bind(this));
        rotate.addEventListener("mousedown", (function (e) {
            _this.rotating = true;
        }).bind(this));
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.addEventListener("mousemove", this.Transform.bind(this));
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.addEventListener("mouseup", this.Reset.bind(this));
        var stroke = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
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
        group.style.display = "none";
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.appendChild(group);
    }
    Object.defineProperty(TransformGrid.prototype, "translateClickPoint", {
        get: function () {
            return this._translateClickPoint;
        },
        set: function (point) {
            this._translateClickPoint = point;
        },
        enumerable: false,
        configurable: true
    });
    TransformGrid.prototype.CreateAdorner = function (id) {
        var adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        adorner.setAttribute("width", this.adornerA.toString());
        adorner.setAttribute("height", this.adornerA.toString());
        adorner.setAttribute("fill", "#ffffff");
        adorner.setAttribute("stroke", this.adornerColor);
        adorner.setAttribute("stroke-width", this.strokeWidth.toString());
        adorner.id = id;
        return adorner;
    };
    TransformGrid.prototype.Transform = function (e) {
        this.TranslateTransform(e);
        this.ScaleXAxes(e);
        this.ScaleYAxes(e);
        this.ScaleAllAxes(e);
        this.RotateTransform(e);
    };
    TransformGrid.prototype.Reset = function () {
        this.moving = false;
        this.scalingX = false;
        this.scalingY = false;
        this.multiScaling = false;
        this.rotating = false;
    };
    TransformGrid.prototype.TranslateTransform = function (e) {
        var _a;
        if (this.moving) {
            var deltaX = e.offsetX - this.translateClickPoint.X;
            var deltaY = e.offsetY - this.translateClickPoint.Y;
            this.translateClickPoint = new Point(e.offsetX, e.offsetY);
            (_a = this.child) === null || _a === void 0 ? void 0 : _a.Translate(deltaX, deltaY);
            this.Refresh();
        }
    };
    TransformGrid.prototype.RotateTransform = function (e) {
        var _a;
        if (this.rotating && this.child) {
            var angleNew = Math.atan2(e.offsetY - this.child.offsetY, e.offsetX - this.child.offsetX) + Math.PI / 2;
            (_a = this.child) === null || _a === void 0 ? void 0 : _a.Rotate(angleNew);
            this.Refresh();
        }
    };
    TransformGrid.prototype.ScaleXAxes = function (e) {
        var _a;
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
            if (this.scaleX < 0) {
                AlertIncorrectTransaformMessage();
            }
            else {
                ClearIncorrectTransaformMessage();
            }
            (_a = this.child) === null || _a === void 0 ? void 0 : _a.ScaleX(this.scaleX);
            this.Refresh();
        }
    };
    TransformGrid.prototype.ScaleYAxes = function (e) {
        var _a;
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
            if (this.scaleY < 0) {
                AlertIncorrectTransaformMessage();
            }
            else {
                ClearIncorrectTransaformMessage();
            }
            (_a = this.child) === null || _a === void 0 ? void 0 : _a.ScaleY(this.scaleY);
            this.Refresh();
        }
    };
    TransformGrid.prototype.ScaleAllAxes = function (e) {
        var _a, _b;
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
            if (this.scaleX < 0 || this.scaleY < 0) {
                AlertIncorrectTransaformMessage();
            }
            else {
                ClearIncorrectTransaformMessage();
            }
            (_a = this.child) === null || _a === void 0 ? void 0 : _a.ScaleY(this.scaleY);
            (_b = this.child) === null || _b === void 0 ? void 0 : _b.ScaleX(this.scaleX);
            this.Refresh();
        }
    };
    TransformGrid.prototype.SetChild = function (element) {
        if (!element) {
            var group = document.getElementById(this.ScaleGroup);
            if (group) {
                group.style.display = "none";
            }
            return;
        }
        else {
            var group = document.getElementById(this.ScaleGroup);
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
    };
    TransformGrid.prototype.Refresh = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var scaleX = document.getElementById(this.ScaleX);
        var scaleY = document.getElementById(this.ScaleY);
        var translate = document.getElementById(this.Translate);
        var scale = document.getElementById(this.MultiScale);
        var stroke = document.getElementById(this.Stroke);
        var rotate = document.getElementById(this.Rotate);
        if (this.child) {
            var pos = new Point(-DefaultA / 2, -DefaultA / 2);
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
            scaleX === null || scaleX === void 0 ? void 0 : scaleX.setAttribute("x", (this.child.points[1].X - this.adornerA / 2).toString());
            scale === null || scale === void 0 ? void 0 : scale.setAttribute("x", (this.child.points[2].X - this.adornerA / 2).toString());
            scaleY === null || scaleY === void 0 ? void 0 : scaleY.setAttribute("x", (this.child.points[3].X - this.adornerA / 2).toString());
            translate === null || translate === void 0 ? void 0 : translate.setAttribute("x", (this.child.points[0].X - this.adornerA / 2).toString());
            rotate === null || rotate === void 0 ? void 0 : rotate.setAttribute("x", (pointRotated.X).toString());
            scaleX === null || scaleX === void 0 ? void 0 : scaleX.setAttribute("y", (this.child.points[1].Y - this.adornerA / 2).toString());
            translate === null || translate === void 0 ? void 0 : translate.setAttribute("y", (this.child.points[0].Y - this.adornerA / 2).toString());
            scaleY === null || scaleY === void 0 ? void 0 : scaleY.setAttribute("y", (this.child.points[3].Y - this.adornerA / 2).toString());
            scale === null || scale === void 0 ? void 0 : scale.setAttribute("y", (this.child.points[2].Y - this.adornerA / 2).toString());
            rotate === null || rotate === void 0 ? void 0 : rotate.setAttribute("y", (pointRotated.Y).toString());
        }
        stroke === null || stroke === void 0 ? void 0 : stroke.setAttribute("points", ((_a = this.child) === null || _a === void 0 ? void 0 : _a.points[0].X) + "," + ((_b = this.child) === null || _b === void 0 ? void 0 : _b.points[0].Y) + " \n" + ((_c = this.child) === null || _c === void 0 ? void 0 : _c.points[1].X) + "," + ((_d = this.child) === null || _d === void 0 ? void 0 : _d.points[1].Y) + "\n" + ((_e = this.child) === null || _e === void 0 ? void 0 : _e.points[2].X) + "," + ((_f = this.child) === null || _f === void 0 ? void 0 : _f.points[2].Y) + "\n" + ((_g = this.child) === null || _g === void 0 ? void 0 : _g.points[3].X) + "," + ((_h = this.child) === null || _h === void 0 ? void 0 : _h.points[3].Y));
    };
    return TransformGrid;
}());
var MainGrid;
var Ellipse = (function () {
    function Ellipse(parent) {
        var _this = this;
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.points = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
        this.type = "e";
        this.parent = parent;
        this.id = "el" + ElementIndex;
        var element = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        element.id = this.id;
        var parentElement = document.getElementById(parent);
        if (parentElement) {
            parentElement.appendChild(element);
        }
        this.cx = 0;
        this.cy = 0;
        this.offsetX = DefaultA;
        this.offsetY = DefaultA;
        this.width = DefaultA;
        this.height = DefaultA;
        this.fill = "#00000000";
        this.stroke = "#000000";
        this.strokeWidth = 4;
        this.rotateAngle = 0;
        this.center = new Point(this.cx, this.cy);
        this.Refresh();
        ElementIndex++;
        this.OnSelected = function (element) { };
        element.addEventListener("mousedown", (function (e) { _this.OnSelected(_this); }).bind(this));
    }
    Ellipse.prototype.Refresh = function () {
        var element = document.getElementById(this.id);
        assert(element);
        {
            element.setAttribute("cx", (this.cx).toString());
            element.setAttribute("cy", (this.cy).toString());
            element.setAttribute("display", "inline");
            if (this.width / 2 >= 0) {
                element.setAttribute("rx", (this.width / 2).toString());
            }
            else {
                element.setAttribute("display", "none");
            }
            if (this.height / 2 >= 0) {
                element.setAttribute("ry", (this.height / 2).toString());
            }
            else {
                element.setAttribute("display", "none");
            }
            element.setAttribute("fill", this.fill);
            element.setAttribute("stroke", this.stroke);
            element.setAttribute("stroke-width", this.strokeWidth.toString());
            element.setAttribute("transform", "matrix(\n" + GlobalScale * Math.cos(this.rotateAngle) + ",\n" + GlobalScale * Math.sin(this.rotateAngle) + ",\n" + GlobalScale * -Math.sin(this.rotateAngle) + ",\n" + GlobalScale * Math.cos(this.rotateAngle) + ",\n" + (this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX) + ",\n" + (this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY) + ")");
        }
        this.SetPointsToDefault();
        this.TransformPoints();
    };
    Ellipse.prototype.SetCenter = function () {
        this.center = new Point(0, 0);
    };
    Ellipse.prototype.SetPointsToDefault = function () {
        var pos = new Point(-DefaultA / 2, -DefaultA / 2);
        this.points[0] = pos;
        this.points[1] = new Point(pos.X + DefaultA, pos.Y);
        this.points[2] = new Point(pos.X + DefaultA, pos.Y + DefaultA);
        this.points[3] = new Point(pos.X, pos.Y + DefaultA);
    };
    Ellipse.prototype.TransformPoints = function () {
        var a = Math.cos(this.rotateAngle) * GlobalScale * this.scaleX;
        var b = Math.sin(this.rotateAngle) * GlobalScale * this.scaleX;
        var c = -Math.sin(this.rotateAngle) * GlobalScale * this.scaleY;
        var d = Math.cos(this.rotateAngle) * GlobalScale * this.scaleY;
        var e = this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX;
        var f = this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY;
        for (var index = 0; index < this.points.length; index++) {
            this.points[index] = new Point(this.points[index].X * a + this.points[index].Y * c + e, this.points[index].X * b + this.points[index].Y * d + f);
        }
    };
    Ellipse.prototype.HideAdorners = function () {
        MainGrid.SetChild(null);
    };
    Ellipse.prototype.ShowAdorners = function () {
        MainGrid.SetChild(this);
    };
    Ellipse.prototype.Delete = function () {
        this.HideAdorners();
        var parentElement = document.getElementById(this.parent);
        var element = document.getElementById(this.id);
        if (element && parentElement) {
            parentElement.removeChild(element);
        }
    };
    Ellipse.prototype.ScaleX = function (value) {
        var translPoint = this.points[0];
        this.width = DefaultA * value;
        this.scaleX = value * GlobalScale;
        this.SetPointsToDefault();
        this.TransformPoints();
        this.offsetY += translPoint.Y - this.points[0].Y;
        this.offsetX += translPoint.X - this.points[0].X;
        this.Refresh();
    };
    Ellipse.prototype.ScaleY = function (value) {
        var translPoint = this.points[0];
        this.height = DefaultA * value;
        this.scaleY = value * GlobalScale;
        this.SetPointsToDefault();
        this.TransformPoints();
        this.offsetY += translPoint.Y - this.points[0].Y;
        this.offsetX += translPoint.X - this.points[0].X;
        this.Refresh();
    };
    Ellipse.prototype.Rotate = function (angle) {
        var angleInRad = angle;
        this.rotateAngle = angleInRad;
        this.SetPointsToDefault();
        this.TransformPoints();
        this.Refresh();
    };
    Ellipse.prototype.Translate = function (x, y) {
        this.offsetX += x;
        this.offsetY += y;
        this.Refresh();
    };
    Ellipse.prototype.GetOriginalWidth = function () {
        return DefaultA;
    };
    Ellipse.prototype.GetOriginalHeight = function () {
        return DefaultA;
    };
    return Ellipse;
}());
var Rectangle = (function () {
    function Rectangle(parent) {
        var _this = this;
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.type = "r";
        this.points = [new Point(0, 0), new Point(0, 0), new Point(0, 0), new Point(0, 0)];
        this.parent = parent;
        this.id = "el" + ElementIndex;
        var element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        element.id = this.id;
        var parentElement = document.getElementById(parent);
        if (parentElement) {
            parentElement.appendChild(element);
        }
        this.cx = 0;
        this.cy = 0;
        this.offsetX = DefaultA;
        this.offsetY = DefaultA;
        this.width = DefaultA;
        this.height = DefaultA;
        this.fill = "#00000000";
        this.stroke = "#000000";
        this.strokeWidth = 4;
        this.rotateAngle = 0;
        this.center = new Point(0, 0);
        this.SetCenter();
        this.Refresh();
        ElementIndex++;
        this.OnSelected = function (element) { };
        element.addEventListener("mousedown", (function (e) { _this.OnSelected(_this); }).bind(this));
    }
    Rectangle.prototype.Refresh = function () {
        var element = document.getElementById(this.id);
        assert(element);
        {
            element.setAttribute("x", (this.cx).toString());
            element.setAttribute("y", (this.cy).toString());
            element.setAttribute("display", "inline");
            if (this.width / 2 >= 0) {
                element.setAttribute("width", (this.width).toString());
            }
            else {
                element.setAttribute("display", "none");
            }
            if (this.height / 2 >= 0) {
                element.setAttribute("height", (this.height).toString());
            }
            else {
                element.setAttribute("display", "none");
            }
            element.setAttribute("fill", this.fill);
            element.setAttribute("stroke", this.stroke);
            element.setAttribute("stroke-width", this.strokeWidth.toString());
            element.style.transform = "matrix(\n" + GlobalScale * Math.cos(this.rotateAngle) + ",\n" + GlobalScale * Math.sin(this.rotateAngle) + ",\n" + GlobalScale * -Math.sin(this.rotateAngle) + ",\n" + GlobalScale * Math.cos(this.rotateAngle) + ",\n" + (this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX) + ",\n" + (this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY) + ")";
        }
        this.SetPointsToDefault();
        this.TransformPoints();
    };
    Rectangle.prototype.SetPointsToDefault = function () {
        var pos = new Point(-DefaultA / 2, -DefaultA / 2);
        this.points[0] = pos;
        this.points[1] = new Point(pos.X + DefaultA, pos.Y);
        this.points[2] = new Point(pos.X + DefaultA, pos.Y + DefaultA);
        this.points[3] = new Point(pos.X, pos.Y + DefaultA);
    };
    Rectangle.prototype.HideAdorners = function () {
        MainGrid.SetChild(null);
    };
    Rectangle.prototype.ShowAdorners = function () {
        MainGrid.SetChild(this);
    };
    Rectangle.prototype.TransformPoints = function () {
        var a = Math.cos(this.rotateAngle) * GlobalScale * this.scaleX;
        var b = Math.sin(this.rotateAngle) * GlobalScale * this.scaleX;
        var c = -Math.sin(this.rotateAngle) * GlobalScale * this.scaleY;
        var d = Math.cos(this.rotateAngle) * GlobalScale * this.scaleY;
        var e = this.center.X - (this.center.X * Math.cos(this.rotateAngle) - this.center.Y * Math.sin(this.rotateAngle)) + this.offsetX;
        var f = this.center.Y - (this.center.Y * Math.cos(this.rotateAngle) + this.center.X * Math.sin(this.rotateAngle)) + this.offsetY;
        for (var index = 0; index < this.points.length; index++) {
            this.points[index] = new Point(this.points[index].X * a + this.points[index].Y * c + e, this.points[index].X * b + this.points[index].Y * d + f);
        }
    };
    Rectangle.prototype.SetCenter = function () {
        this.center = new Point(0, 0);
        this.cx = -this.width / 2;
        this.cy = -this.height / 2;
        this.Refresh();
    };
    Rectangle.prototype.Delete = function () {
        this.HideAdorners();
        var parentElement = document.getElementById(this.parent);
        var element = document.getElementById(this.id);
        if (element && parentElement) {
            parentElement.removeChild(element);
        }
    };
    Rectangle.prototype.ScaleX = function (value) {
        var translPoint = this.points[0];
        this.width = DefaultA * value;
        this.scaleX = value * GlobalScale;
        this.SetPointsToDefault();
        this.TransformPoints();
        this.offsetY += translPoint.Y - this.points[0].Y;
        this.offsetX += translPoint.X - this.points[0].X;
        this.SetCenter();
        this.Refresh();
    };
    Rectangle.prototype.ScaleY = function (value) {
        var translPoint = this.points[0];
        this.height = DefaultA * value;
        this.scaleY = value * GlobalScale;
        this.SetPointsToDefault();
        this.TransformPoints();
        this.offsetY += translPoint.Y - this.points[0].Y;
        this.offsetX += translPoint.X - this.points[0].X;
        this.SetCenter();
        this.Refresh();
    };
    Rectangle.prototype.Rotate = function (angle) {
        var angleInRad = angle;
        this.rotateAngle = angleInRad;
        this.SetPointsToDefault();
        this.TransformPoints();
        this.Refresh();
    };
    Rectangle.prototype.Translate = function (x, y) {
        this.offsetX += x;
        this.offsetY += y;
        this.SetCenter();
        this.Refresh();
    };
    Rectangle.prototype.GetOriginalWidth = function () {
        return DefaultA;
    };
    Rectangle.prototype.GetOriginalHeight = function () {
        return DefaultA;
    };
    return Rectangle;
}());
var BezierType;
(function (BezierType) {
    BezierType[BezierType["quadratic"] = 0] = "quadratic";
    BezierType[BezierType["cubic"] = 1] = "cubic";
})(BezierType || (BezierType = {}));
var BezierSegment = (function () {
    function BezierSegment(parent, type) {
        var _this = this;
        this.AdonerPoints = [];
        this.AdonerMove = [];
        this.adornerA = 10;
        this.adornerColor = "#53b6ee";
        this.type = "b";
        this.parent = parent;
        this.Type = type;
        var parentElement = document.getElementById(parent);
        this.fill = "#00000000";
        this.stroke = "#000000";
        this.strokeWidth = 4;
        this.id = "el" + ElementIndex;
        this.AdonerGroupId = this.id + "_AdornerGroup";
        if (type == BezierType.quadratic) {
            this.Points = [new Point(this.strokeWidth / 2 + DefaultA, DefaultA * 2 + this.strokeWidth / 2), new Point(this.strokeWidth / 2 + DefaultA, this.strokeWidth / 2 + DefaultA), new Point(DefaultA * 2 + this.strokeWidth / 2, this.strokeWidth / 2 + DefaultA)];
        }
        if (type == BezierType.cubic) {
            this.Points = [new Point(this.strokeWidth / 2 + DefaultA, DefaultA * 2 + this.strokeWidth / 2), new Point(this.strokeWidth / 2 + DefaultA, this.strokeWidth / 2 + DefaultA), new Point(DefaultA * 2 + this.strokeWidth / 2, this.strokeWidth / 2 + DefaultA), new Point(DefaultA * 2 + this.strokeWidth / 2, this.strokeWidth / 2)];
        }
        this._Points = this.Points;
        var element = document.createElementNS("http://www.w3.org/2000/svg", "path");
        element.id = this.id;
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.appendChild(element);
        var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.id = this.AdonerGroupId;
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.appendChild(group);
        this.Adorners = [];
        this.StrokePolyline = this.id + "_Polyline";
        var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        polyline.setAttribute("stroke", this.adornerColor);
        polyline.setAttribute("stroke-width", "2");
        polyline.setAttribute("fill", "none");
        polyline.id = this.StrokePolyline;
        group.appendChild(polyline);
        this.CreateAdoners();
        this.Refresh();
        ElementIndex++;
        this.OnSelected = function (element) { };
        element.addEventListener("mousedown", (function (e) { _this.OnSelected(_this); }).bind(this));
    }
    Object.defineProperty(BezierSegment.prototype, "Points", {
        get: function () {
            return this._Points;
        },
        set: function (points) {
            if (points.length == 3 && this.Type == BezierType.quadratic) {
                this._Points = points;
            }
            if (points.length == 4 && this.Type == BezierType.cubic) {
                this._Points = points;
            }
        },
        enumerable: false,
        configurable: true
    });
    BezierSegment.prototype.CreateAdorner = function (id) {
        var adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        adorner.setAttribute("width", this.adornerA.toString());
        adorner.setAttribute("height", this.adornerA.toString());
        adorner.setAttribute("fill", "#ffffff");
        adorner.setAttribute("stroke", this.adornerColor);
        adorner.setAttribute("stroke-width", "2");
        adorner.id = id;
        return adorner;
    };
    BezierSegment.prototype.CreateAdoners = function () {
        var _this = this;
        var group = document.getElementById(this.AdonerGroupId);
        var parentElement = document.getElementById(this.parent);
        if (group && parentElement) {
            for (var index = 0; index < this.Points.length; index++) {
                var adonerId = this.id + "_BezierAdorner_" + index;
                var adorner = this.CreateAdorner(adonerId);
                group.appendChild(adorner);
                this.Adorners[index] = adonerId;
                adorner.addEventListener("mousedown", (function (e) {
                    if (e.target) {
                        var target = e.target.id;
                        var split = target.toString().split("_");
                        var index_1 = Number.parseInt(split[split.length - 1]);
                        _this.AdonerPoints[index_1] = new Point(e.offsetX, e.offsetY);
                        _this.AdonerMove[index_1] = true;
                    }
                }).bind(this));
            }
            parentElement.addEventListener("mousemove", (function (e) {
                var index = 0;
                for (var i = 0; i < _this.AdonerMove.length; i++) {
                    if (_this.AdonerMove[i]) {
                        index = i;
                        break;
                    }
                }
                if (_this.AdonerMove[index]) {
                    _this.Points[index].X += e.offsetX - _this.AdonerPoints[index].X;
                    _this.Points[index].Y += e.offsetY - _this.AdonerPoints[index].Y;
                    _this.AdonerPoints[index] = new Point(e.offsetX, e.offsetY);
                }
                _this.Refresh();
            }).bind(this));
            parentElement.addEventListener("mouseup", (function (e) {
                for (var index = 0; index < _this.AdonerMove.length; index++) {
                    _this.AdonerMove[index] = false;
                }
            }).bind(this));
        }
    };
    BezierSegment.prototype.ArrayToString = function (points) {
        var str = "";
        for (var index = 0; index < points.length; index++) {
            str += points[index].X + "," + points[index].Y + " ";
        }
        return str;
    };
    BezierSegment.prototype.Refresh = function () {
        var element = document.getElementById(this.id);
        if (this.Type == BezierType.quadratic) {
            element === null || element === void 0 ? void 0 : element.setAttribute("d", "M" + this.Points[0].X + "," + this.Points[0].Y + " Q" + this.Points[1].X + "," + this.Points[1].Y + " " + this.Points[2].X + "," + this.Points[2].Y);
        }
        if (this.Type == BezierType.cubic) {
            element === null || element === void 0 ? void 0 : element.setAttribute("d", "M" + this.Points[0].X + "," + this.Points[0].Y + " C" + this.Points[1].X + "," + this.Points[1].Y + " " + this.Points[2].X + "," + this.Points[2].Y + " " + this.Points[3].X + "," + this.Points[3].Y);
        }
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke", this.stroke);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-width", this.strokeWidth.toString());
        element === null || element === void 0 ? void 0 : element.setAttribute("fill", this.fill);
        for (var index = 0; index < this.Points.length; index++) {
            var adorner = document.getElementById(this.Adorners[index]);
            if (adorner) {
                adorner.setAttribute("x", (this.Points[index].X - this.adornerA / 2).toString());
                adorner.setAttribute("y", (this.Points[index].Y - this.adornerA / 2).toString());
            }
        }
        var stroke = document.getElementById(this.StrokePolyline);
        stroke === null || stroke === void 0 ? void 0 : stroke.setAttribute("points", this.ArrayToString(this.Points));
    };
    BezierSegment.prototype.Delete = function () {
        var parentElement = document.getElementById(this.parent);
        var element = document.getElementById(this.id);
        var group = document.getElementById(this.AdonerGroupId);
        var poly = document.getElementById(this.StrokePolyline);
        if (element && parentElement && group && poly) {
            parentElement.removeChild(element);
            parentElement.removeChild(group);
            parentElement.removeChild(poly);
        }
    };
    BezierSegment.prototype.HideAdorners = function () {
        var group = document.getElementById(this.AdonerGroupId);
        if (group) {
            group.style.display = "none";
        }
    };
    BezierSegment.prototype.ShowAdorners = function () {
        var group = document.getElementById(this.AdonerGroupId);
        if (group) {
            group.style.display = "inline";
        }
    };
    return BezierSegment;
}());
var Polyline = (function () {
    function Polyline(parent) {
        var _this = this;
        this.fill = "none";
        this.stroke = "black";
        this.strokeWidth = 4;
        this.Points = [];
        this.AdonerPoints = [];
        this.AdonerMove = [];
        this.Adorners = [];
        this.adornerA = 10;
        this.adornerColor = "#53b6ee";
        this.type = "p";
        this._closed = false;
        this.closedPolyline = false;
        this.smooth = false;
        this.parent = parent;
        this.fill = "#00000000";
        this.stroke = "#000000";
        this.id = "el" + ElementIndex;
        this.AdonerGroupId = this.id + "_AdornerGroup";
        var parentElement = document.getElementById(parent);
        var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.id = this.AdonerGroupId;
        var polyline = document.createElementNS("http://www.w3.org/2000/svg", "path");
        polyline.id = this.id;
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.appendChild(polyline);
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.appendChild(group);
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.addEventListener("mousedown", function (e) { _this.AddPoint(new Point(e.offsetX, e.offsetY)); });
        ElementIndex++;
        this.smooth = true;
        this.OnSelected = function (element) { };
        polyline.addEventListener("mousedown", (function (e) { _this.OnSelected(_this); }).bind(this));
    }
    Object.defineProperty(Polyline.prototype, "closed", {
        get: function () {
            return this._closed;
        },
        set: function (value) {
            this._closed = value;
        },
        enumerable: false,
        configurable: true
    });
    Polyline.prototype.CreateAdorner = function (id) {
        var adorner = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        adorner.setAttribute("width", this.adornerA.toString());
        adorner.setAttribute("height", this.adornerA.toString());
        adorner.setAttribute("fill", "#ffffff");
        adorner.setAttribute("stroke", this.adornerColor);
        adorner.setAttribute("stroke-width", "2");
        adorner.id = id;
        return adorner;
    };
    Polyline.prototype.CheckCollision = function (adornerPoint, point) {
        var adornerX = adornerPoint.X - this.adornerA / 2;
        var adornerY = adornerPoint.Y - this.adornerA / 2;
        var adornerX2 = adornerPoint.X + this.adornerA / 2;
        var adornerY2 = adornerPoint.Y + this.adornerA / 2;
        return (adornerX < point.X && adornerX2 > point.X && adornerY < point.Y && adornerY2 > point.Y);
    };
    Polyline.prototype.AddPoint = function (point) {
        if (!this.closed) {
            if (this.Points.length >= 2) {
                var collison1 = this.CheckCollision(this.Points[0], point);
                var collison2 = this.CheckCollision(this.Points[this.Points.length - 1], point);
                if (collison1) {
                    this.closedPolyline = true;
                    this.Points.push(this.Points[0]);
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
            var adornerId = this.id + "_Adorner_" + (this.Points.length - 1);
            var adorner = this.CreateAdorner(adornerId);
            adorner.setAttribute("x", (point.X - this.adornerA / 2).toString());
            adorner.setAttribute("y", (point.Y - this.adornerA / 2).toString());
            this.AdonerMove.push(false);
            this.Adorners.push(adornerId);
            this.AdonerPoints.push(new Point(0, 0));
            var group = document.getElementById(this.AdonerGroupId);
            group === null || group === void 0 ? void 0 : group.appendChild(adorner);
            this.Refresh();
        }
    };
    Polyline.prototype.GetBezierMidPoint = function (p1, p3, intersection) {
        var t = 0.5;
        var x = (intersection.X - Math.pow((1 - t), 2) * p1.X - t * t * p3.X) / (2 * (1 - t) * t);
        var y = (intersection.Y - Math.pow((1 - t), 2) * p1.Y - t * t * p3.Y) / (2 * (1 - t) * t);
        return new Point(x, y);
    };
    Polyline.prototype.ArrayToString = function (points) {
        var str = "";
        if (!this.smooth) {
            if (points.length >= 1) {
                str = "M" + points[0].X + "," + points[0].Y;
                for (var index = 1; index < points.length; index++) {
                    str += "L" + points[index].X + "," + points[index].Y;
                }
                if (this.closedPolyline) {
                    str += "L" + points[0].X + "," + points[0].Y;
                }
            }
        }
        else {
            if (points.length >= 1) {
                str = "M" + points[0].X + "," + points[0].Y;
                for (var index = 0; index < points.length; index += 2) {
                    if (index + 2 < points.length) {
                        var point = this.GetBezierMidPoint(points[index], points[index + 2], points[index + 1]);
                        str += "Q" + point.X + "," + point.Y + " " + points[index + 2].X + "," + points[index + 2].Y;
                    }
                    else {
                        str += "L" + points[points.length - 1].X + "," + points[points.length - 1].Y;
                        break;
                    }
                }
            }
        }
        return str;
    };
    Polyline.prototype.ClosePath = function () {
        var _this = this;
        var parentElement = document.getElementById(this.parent);
        this.closed = true;
        for (var index = 0; index < this.Adorners.length; index++) {
            var element = document.getElementById(this.Adorners[index]);
            if (element) {
                element.addEventListener("mousedown", (function (e) {
                    if (e.target) {
                        var target = e.target.id;
                        var split = target.toString().split("_");
                        var index_2 = Number.parseInt(split[split.length - 1]);
                        _this.AdonerPoints[index_2] = new Point(e.offsetX, e.offsetY);
                        _this.AdonerMove[index_2] = true;
                    }
                }).bind(this));
            }
        }
        if (parentElement) {
            parentElement.addEventListener("mousemove", (function (e) {
                var index = 0;
                for (var i = 0; i < _this.AdonerMove.length; i++) {
                    if (_this.AdonerMove[i]) {
                        index = i;
                        break;
                    }
                }
                if (_this.AdonerMove[index]) {
                    _this.Points[index].X += e.offsetX - _this.AdonerPoints[index].X;
                    _this.Points[index].Y += e.offsetY - _this.AdonerPoints[index].Y;
                    _this.AdonerPoints[index] = new Point(e.offsetX, e.offsetY);
                }
                _this.Refresh();
            }).bind(this));
            parentElement.addEventListener("mouseup", (function (e) {
                for (var index = 0; index < _this.AdonerMove.length; index++) {
                    _this.AdonerMove[index] = false;
                }
            }).bind(this));
        }
    };
    Polyline.prototype.Refresh = function () {
        var element = document.getElementById(this.id);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke", this.stroke);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-width", this.strokeWidth.toString());
        element === null || element === void 0 ? void 0 : element.setAttribute("fill", this.fill);
        element === null || element === void 0 ? void 0 : element.setAttribute("d", this.ArrayToString(this.Points));
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-linejoin", "round");
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-linecap", "round");
        for (var index = 0; index < this.Points.length; index++) {
            var adorner = document.getElementById(this.Adorners[index]);
            if (adorner) {
                adorner.setAttribute("x", (this.Points[index].X - this.adornerA / 2).toString());
                adorner.setAttribute("y", (this.Points[index].Y - this.adornerA / 2).toString());
            }
        }
    };
    Polyline.prototype.Delete = function () {
        var parentElement = document.getElementById(this.parent);
        var element = document.getElementById(this.id);
        var group = document.getElementById(this.AdonerGroupId);
        if (element && parentElement && group) {
            parentElement.removeChild(element);
            parentElement.removeChild(group);
        }
    };
    Polyline.prototype.HideAdorners = function () {
        var group = document.getElementById(this.AdonerGroupId);
        if (group && this.closed) {
            group.style.display = "none";
        }
    };
    Polyline.prototype.ShowAdorners = function () {
        var group = document.getElementById(this.AdonerGroupId);
        if (group && this.closed) {
            group.style.display = "inline";
        }
    };
    return Polyline;
}());
var Brush = (function () {
    function Brush(parent) {
        var _this = this;
        this.fill = "none";
        this.stroke = "black";
        this.strokeWidth = 4;
        this.Points = [];
        this._closed = false;
        this.openedPath = false;
        this.type = "i";
        this.parent = parent;
        this.fill = "#00000000";
        this.stroke = "#000000";
        this.id = "el" + ElementIndex;
        var parentElement = document.getElementById(parent);
        var polyline = document.createElementNS("http://www.w3.org/2000/svg", "path");
        polyline.id = this.id;
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.appendChild(polyline);
        ElementIndex++;
        this.OnSelected = function (element) { };
        polyline.addEventListener("mousedown", (function (e) { _this.OnSelected(_this); }).bind(this));
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.addEventListener("mousedown", (function (e) {
            if (!closed) {
                _this.AddPoint(new Point(e.offsetX, e.offsetY));
                _this.openedPath = true;
            }
        }).bind(this));
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.addEventListener("mousemove", (function (e) {
            if (!closed && _this.openedPath) {
                _this.AddPoint(new Point(e.offsetX, e.offsetY));
            }
        }).bind(this));
        parentElement === null || parentElement === void 0 ? void 0 : parentElement.addEventListener("mouseup", (function (e) { _this.ClosePath(); }).bind(this));
    }
    Object.defineProperty(Brush.prototype, "closed", {
        get: function () {
            return this._closed;
        },
        set: function (value) {
            this._closed = value;
        },
        enumerable: false,
        configurable: true
    });
    Brush.prototype.AddPoint = function (point) {
        if (!this.closed) {
            this.Points.push(point);
            this.Refresh();
        }
    };
    Brush.prototype.GetBezierMidPoint = function (p1, p3, intersection) {
        var t = 0.5;
        var x = (intersection.X - Math.pow((1 - t), 2) * p1.X - t * t * p3.X) / (2 * (1 - t) * t);
        var y = (intersection.Y - Math.pow((1 - t), 2) * p1.Y - t * t * p3.Y) / (2 * (1 - t) * t);
        return new Point(x, y);
    };
    Brush.prototype.ArrayToString = function (points) {
        var str = "";
        if (points.length >= 1) {
            str = "M" + points[0].X + "," + points[0].Y;
            for (var index = 1; index < points.length; index++) {
                str += "L" + points[index].X + "," + points[index].Y;
            }
        }
        return str;
    };
    Brush.prototype.ClosePath = function () {
        this.closed = true;
    };
    Brush.prototype.Refresh = function () {
        var element = document.getElementById(this.id);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke", this.stroke);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-width", this.strokeWidth.toString());
        element === null || element === void 0 ? void 0 : element.setAttribute("fill", this.fill);
        element === null || element === void 0 ? void 0 : element.setAttribute("d", this.ArrayToString(this.Points));
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-linejoin", "round");
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-linecap", "round");
    };
    Brush.prototype.Delete = function () {
        var parentElement = document.getElementById(this.parent);
        var element = document.getElementById(this.id);
        if (element && parentElement) {
            parentElement.removeChild(element);
        }
    };
    Brush.prototype.HideAdorners = function () {
        var element = document.getElementById(this.id);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-dasharray", "0");
    };
    Brush.prototype.ShowAdorners = function () {
        var element = document.getElementById(this.id);
        element === null || element === void 0 ? void 0 : element.setAttribute("stroke-dasharray", "20");
    };
    return Brush;
}());
function ResizeResult() {
    var _a;
    var svg = document.getElementById("parent");
    var size = (_a = document.getElementById("result")) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
    if (svg) {
        svg.setAttribute("viewBox", "0,0," + (size === null || size === void 0 ? void 0 : size.width) + "," + (size === null || size === void 0 ? void 0 : size.height));
    }
}
function Start() {
    MainGrid = new TransformGrid('parent');
    ResizeResult();
}
function DeselectAll() {
    for (var index = 0; index < Elements.length; index++) {
        var el = Elements[index];
        el.HideAdorners();
    }
    SelectedElement = null;
}
function SetColorMenuProperties(element) {
    var fill = document.getElementById("setFillColorInp");
    var stroke = document.getElementById("setBrushColorInp");
    var strokewidth = document.getElementById("setWeightInp");
    if (element.fill.length > 7) {
        fill.value = "#ffffff";
    }
    else {
        fill.value = element.fill;
    }
    if (element.stroke.length > 7) {
        stroke.value = "#ffffff";
    }
    else {
        stroke.value = element.stroke;
    }
    strokewidth.value = element.strokeWidth.toString();
}
function SelectElement(element) {
    DeselectAll();
    element.ShowAdorners();
    SetColorMenuProperties(element);
}
function CreateEllipse() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new Ellipse('parent');
    SelectedElement = el;
    MainGrid.SetChild(el);
    Elements.push(el);
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function CreateRectangle() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new Rectangle('parent');
    SelectedElement = el;
    MainGrid.SetChild(el);
    Elements.push(el);
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function CreatePolyline() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new Polyline('parent');
    SelectedElement = el;
    el.smooth = false;
    CurrentDynamicPath = el;
    Elements.push(el);
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function CreateQuadraticBezier() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new BezierSegment('parent', BezierType.quadratic);
    SelectedElement = el;
    Elements.push(el);
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function CreateCubicBezier() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new BezierSegment('parent', BezierType.cubic);
    SelectedElement = el;
    Elements.push(el);
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function CreateSmoothPath() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new Polyline('parent');
    el.smooth = true;
    SelectedElement = el;
    Elements.push(el);
    CurrentDynamicPath = el;
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function CreateBrush() {
    if (CurrentDynamicPath != null) {
        if (!CurrentDynamicPath.closed) {
            return;
        }
    }
    DeselectAll();
    var el = new Brush('parent');
    SelectedElement = el;
    Elements.push(el);
    CurrentDynamicPath = el;
    el.OnSelected = function (element) {
        if (CurrentDynamicPath) {
            if (CurrentDynamicPath.closed) {
                SelectElement(element);
                SelectedElement = element;
            }
        }
        else {
            SelectElement(element);
            SelectedElement = element;
        }
    };
}
function ChangeSelectedElementProperties() {
    if (SelectedElement) {
        var strokeColorPicker = document.getElementById("setBrushColorInp");
        var fillColorPicker = document.getElementById("setFillColorInp");
        var weight = document.getElementById("setWeightInp");
        SelectedElement.stroke = strokeColorPicker === null || strokeColorPicker === void 0 ? void 0 : strokeColorPicker.value;
        SelectedElement.fill = fillColorPicker === null || fillColorPicker === void 0 ? void 0 : fillColorPicker.value;
        SelectedElement.strokeWidth = Number.parseFloat(weight === null || weight === void 0 ? void 0 : weight.value);
        SelectedElement.Refresh();
    }
}
function SetTransparentFill() {
    if (SelectedElement) {
        SelectedElement.fill = "#00000000";
        SelectedElement.Refresh();
        SetColorMenuProperties(SelectedElement);
    }
}
function SetTransparentStroke() {
    if (SelectedElement) {
        SelectedElement.stroke = "#00000000";
        SelectedElement.Refresh();
        SetColorMenuProperties(SelectedElement);
    }
}
function DeleteSelectedElement() {
    if (SelectedElement) {
        SelectedElement.Delete();
        var index = Elements.indexOf(SelectedElement);
        Elements.splice(index);
        SelectedElement = null;
    }
}
function Serialize() {
    var list = JSON.stringify(Elements);
    localStorage.setItem("file", list);
}
function Deserialize() {
    var str = localStorage.getItem("file");
    for (var index = 0; index < Elements.length; index++) {
        Elements[index].Delete();
    }
    SelectedElement = null;
    if (str) {
        var list = JSON.parse(str);
        for (var index = 0; index < list.length; index++) {
            var element = list[index];
            if (element.type == "r") {
                var el = element;
                var rect = new Rectangle('parent');
                rect.fill = el.fill;
                rect.stroke = el.stroke;
                rect.strokeWidth = el.strokeWidth;
                rect.Translate(el.offsetX - DefaultA, el.offsetY - DefaultA);
                rect.width = el.width;
                rect.height = el.height;
                rect.scaleX = el.scaleX;
                rect.scaleY = el.scaleY;
                rect.SetCenter();
                rect.Refresh();
                rect.Rotate(el.rotateAngle);
                Elements.push(rect);
                rect.OnSelected = function (element) {
                    if (CurrentDynamicPath) {
                        if (CurrentDynamicPath.closed) {
                            SelectElement(element);
                            SelectedElement = element;
                        }
                    }
                    else {
                        SelectElement(element);
                        SelectedElement = element;
                    }
                };
                rect.HideAdorners();
            }
            if (element.type == "e") {
                var el = element;
                var ellipse = new Ellipse('parent');
                ellipse.fill = el.fill;
                ellipse.stroke = el.stroke;
                ellipse.strokeWidth = el.strokeWidth;
                ellipse.Translate(el.offsetX - DefaultA, el.offsetY - DefaultA);
                ellipse.width = el.width;
                ellipse.height = el.height;
                ellipse.scaleX = el.scaleX;
                ellipse.scaleY = el.scaleY;
                ellipse.Refresh();
                ellipse.Rotate(el.rotateAngle);
                Elements.push(ellipse);
                ellipse.OnSelected = function (element) {
                    if (CurrentDynamicPath) {
                        if (CurrentDynamicPath.closed) {
                            SelectElement(element);
                            SelectedElement = element;
                        }
                    }
                    else {
                        SelectElement(element);
                        SelectedElement = element;
                    }
                };
                ellipse.HideAdorners();
            }
            if (element.type == "b") {
                var el = element;
                var bezier = new BezierSegment('parent', el.Type);
                bezier.fill = el.fill;
                bezier.stroke = el.stroke;
                bezier.strokeWidth = el.strokeWidth;
                bezier.Points = el._Points;
                bezier.Refresh();
                Elements.push(bezier);
                bezier.OnSelected = function (element) {
                    if (CurrentDynamicPath) {
                        if (CurrentDynamicPath.closed) {
                            SelectElement(element);
                            SelectedElement = element;
                        }
                    }
                    else {
                        SelectElement(element);
                        SelectedElement = element;
                    }
                };
                bezier.HideAdorners();
            }
            if (element.type == "p") {
                var el = element;
                var path = new Polyline('parent');
                path.fill = el.fill;
                path.stroke = el.stroke;
                path.strokeWidth = el.strokeWidth;
                for (var index_3 = 0; index_3 < el.Points.length; index_3++) {
                    path.AddPoint(el.Points[index_3]);
                }
                path.smooth = el.smooth;
                path.Refresh();
                path.ClosePath();
                Elements.push(path);
                path.closedPolyline = el.closedPolyline;
                path.OnSelected = function (element) {
                    if (CurrentDynamicPath) {
                        if (CurrentDynamicPath.closed) {
                            SelectElement(element);
                            SelectedElement = element;
                        }
                    }
                    else {
                        SelectElement(element);
                        SelectedElement = element;
                    }
                };
                path.HideAdorners();
            }
            if (element.type == "i") {
                var el = element;
                var path = new Brush('parent');
                path.fill = el.fill;
                path.stroke = el.stroke;
                path.strokeWidth = el.strokeWidth;
                for (var index_4 = 0; index_4 < el.Points.length; index_4++) {
                    path.AddPoint(el.Points[index_4]);
                }
                path.Refresh();
                path.ClosePath();
                Elements.push(path);
                path.OnSelected = function (element) {
                    if (CurrentDynamicPath) {
                        if (CurrentDynamicPath.closed) {
                            SelectElement(element);
                            SelectedElement = element;
                        }
                    }
                    else {
                        SelectElement(element);
                        SelectedElement = element;
                    }
                };
                path.HideAdorners();
            }
        }
    }
}
function AlertIncorrectTransaformMessage() {
    var message = document.getElementById("message");
    if (message) {
        message.innerText = "Некорректная матрица трансформации";
    }
}
function ClearIncorrectTransaformMessage() {
    var message = document.getElementById("message");
    if (message) {
        message.innerText = "";
    }
}
//# sourceMappingURL=main.js.map