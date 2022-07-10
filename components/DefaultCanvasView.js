class DefaultCanvasView {
    canvas = null;
    context = null;

    renderer = null;

    _playing = false;

    quality = 1;
    qualityRatio = 1;
    computedQuality = 1;
    targetQualityRatio = 1;

    _downedCursor;
    _cursor;
    _moving = false;

    _keyTimes = {};

    constructor(canvas, renderer) {
        console.log("initialize");

        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;

        this.renderer = renderer;

        // Autoplay
        this.play();

        canvas.addEventListener("mousedown", (evt) => this.onPointerDown(evt));
        canvas.addEventListener("mousemove", (evt) => this.onPointerMove(evt));
        canvas.addEventListener("mouseup", (evt) => this.onPointerUp(evt));
        canvas.addEventListener("mouseout", (evt) => this.onPointerUp(evt));
        canvas.addEventListener("mouseleave", (evt) => this.onPointerUp(evt));
        canvas.addEventListener("touchstart", (evt) => this.onPointerDown(evt));
        canvas.addEventListener("touchmove", (evt) => this.onPointerMove(evt));
        canvas.addEventListener("touchend", (evt) => this.onPointerUp(evt));
        document.body.addEventListener("keydown", (evt) => this.onKeyDown(evt));
        document.body.addEventListener("keyup", (evt) => this.onKeyUp(evt));
    }

    destroy() {

    }

    play() {
        console.log("play");

        if (this._playing) return;
        this._playing = true;
        this._requestRender(this.context);
    }

    stop() {
        console.log("stop");

        if (!this._playing) return;
        this._playing = false;
    }

    release() {
        console.log("release");

        this._playing = false;

        // Release All Objects
    }

    _requestRender(context) {
        if (this.fpsCounterView) {
            this.fpsCounterView.count();
        }

        var self = this;
        window.requestAnimationFrame(() => {
            self._compute();

            self.renderer.compute();
            self.renderer.render(context, {
                keyTimes: this._keyTimes,
                downedCursor: this._downedCursor,
                cursor: this._cursor
            });

            if (self._playing) {
                self._requestRender(context);
            }
        });
    }

    _compute() {
        if (this.canvas.clientWidth * this.canvas.clientHeight > 480000) { // 800 * 600
            this.quality = 1;
        } else {
            this.quality = 2;
        }
        this.computedQuality = this.quality * this.qualityRatio;
        this.renderer.setQuality(this.computedQuality);

        this.canvas.width = this.canvas.clientWidth * this.computedQuality;
        this.canvas.height = this.canvas.clientHeight * this.computedQuality;
        this.renderer.setCanvasSize(this.canvas.width, this.canvas.height);

        if (this.targetQualityRatio > this.qualityRatio) {
            this.qualityRatio = Math.min(this.qualityRatio * 1.2, this.targetQualityRatio);
        } else if (this.targetQualityRatio < this.qualityRatio) {
            this.qualityRatio = Math.max(this.qualityRatio / 1.2, this.targetQualityRatio);
        }
    }

    fadeOut(duration, onFaded) {
        $(this.canvas).stop().fadeOut(duration, () => onFaded && onFaded());
    }

    fadeIn(duration, onFaded) {
        $(this.canvas).stop().fadeIn(duration, () => onFaded && onFaded());
    }

    _pointerPosition(evt) {
        var pointer = evt.targetTouches ? evt.targetTouches[0] : evt;
        return {
            x: pointer.pageX,
            y: pointer.pageY
        };
    }

    onPointerDown(evt) {
        if (evt.type == "touchstart") {
            evt.preventDefault(); //for Mobile
        }

        var pointer = this._pointerPosition(evt);

        var cursorX = pointer.x - this.canvas.width / 2 / this.computedQuality;
        var cursorY = pointer.y - this.canvas.height / 2 / this.computedQuality;
        this._downedCursor = {x: cursorX, y: cursorY};
        this._cursor = {x: cursorX, y: cursorY};

        this._moving = true;

        console.log("down", cursorX, cursorY);
    }

    onPointerMove(evt) {
        if (!this._moving) {
            return null;
        }

        var pointer = this._pointerPosition(evt);

        // 포인터 중심 위치
        const cursorX = pointer.x - this.canvas.width / 2 / this.computedQuality;
        const cursorY = pointer.y - this.canvas.height / 2 / this.computedQuality;
        this._cursor = {x: cursorX, y: cursorY};

        console.log("move", cursorX, cursorY);

        if (Math.abs(this._downedCursor.x - this._cursor.x) > Math.abs(this._downedCursor.y - this._cursor.y)) {
            if (this._downedCursor.x < this._cursor.x) {
                if (this._keyTimes["right"] == null) {
                    this._keyTimes["right"] = Date.now();
                    delete this._keyTimes["left"];
                    delete this._keyTimes["up"];
                    delete this._keyTimes["down"];
                }
            } else if (this._downedCursor.x > this._cursor.x) {
                if (this._keyTimes["left"] == null) {
                    this._keyTimes["left"] = Date.now();
                    delete this._keyTimes["right"];
                    delete this._keyTimes["up"];
                    delete this._keyTimes["down"];
                }
            }
        } else {
            if (this._downedCursor.y < this._cursor.y) {
                if (this._keyTimes["down"] == null) {
                    this._keyTimes["down"] = Date.now();
                    delete this._keyTimes["left"];
                    delete this._keyTimes["right"];
                    delete this._keyTimes["up"];
                }
            } else if (this._downedCursor.y > this._cursor.y) {
                if (this._keyTimes["up"] == null) {
                    this._keyTimes["up"] = Date.now();
                    delete this._keyTimes["left"];
                    delete this._keyTimes["right"];
                    delete this._keyTimes["down"];
                }
            }
        }
    }

    onPointerUp(evt) {
        if (!this._moving) {
            return null;
        }

        var pointer = this._pointerPosition(evt);
        if (!pointer) {
            return;
        }

        // 포인터 중심 위치
        const cursorX = pointer.x - this.canvas.width / 2 / this.computedQuality;
        const cursorY = pointer.y - this.canvas.height / 2 / this.computedQuality;
        this._downedCursor = null;
        this._cursor = null;
        this._moving = false;

        console.log("up", cursorX, cursorY);
        
        delete this._keyTimes["left"];
        delete this._keyTimes["right"];
        delete this._keyTimes["up"];
        delete this._keyTimes["down"];
    }

    _keyCodeToName(keyCode) {
        switch (keyCode) {
            case 37: return "left";
            case 38: return "up";
            case 39: return "right";
            case 40: return "down";
            case 32: return "jump";
        }
        return "";
    }

    onKeyDown(evt) {
        const keyName = this._keyCodeToName(evt.which);
        if (this._keyTimes[keyName] != null) {
            return
        }

        if (keyName) {
            this._keyTimes[keyName] = Date.now();
        }
    }

    onKeyUp(evt) {
        const keyName = this._keyCodeToName(evt.which);
        delete this._keyTimes[keyName];
    }
}