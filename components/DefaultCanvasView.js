class DefaultCanvasView {
    canvas = null;
    context = null;

    renderer = null;

    _playing = false;

    quality = 1;
    qualityRatio = 1;
    computedQuality = 1;
    targetQualityRatio = 1;

    onPressArrowKey;

    _moving = false;

    _pressedTimes = {};
    _pressedKeys = {};
    _intervalForPressedKeys;

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

        this._intervalForPressedKeys = setInterval(() => {
            this._onPressArrowKey(this._pressedTimes);
        }, 1000 / 60);
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

    setOnPressArrowKey(onPressArrowKey) {
        this._onPressArrowKey = onPressArrowKey;
    }

    _requestRender(context) {
        if (this.fpsCounterView) {
            this.fpsCounterView.count();
        }

        var self = this;
        window.requestAnimationFrame(() => {
            self._compute();

            self.renderer.compute();
            self.renderer.render(context);

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

        this._moving = true;

        console.log("down", cursorX, cursorY);
    }

    onPointerMove(evt) {
        if (!this._moving) {
            return null;
        }

        var pointer = this._pointerPosition(evt);

        // 포인터 중심 위치
        var cursorX = pointer.x - this.canvas.width / 2 / this.computedQuality;
        var cursorY = pointer.y - this.canvas.height / 2 / this.computedQuality;

        console.log("move", cursorX, cursorY);
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
        var cursorX = pointer.x - this.canvas.width / 2 / this.computedQuality;
        var cursorY = pointer.y - this.canvas.height / 2 / this.computedQuality;

        console.log("up", cursorX, cursorY);
    }

    _keyCodeToName(keyCode) {
        switch (keyCode) {
            case 37: return "left";
            case 38: return "up";
            case 39: return "right";
            case 40: return "down";
        }
        return "";
    }

    onKeyDown(evt) {
        const keyName = this._keyCodeToName(evt.which);
        if (this._pressedTimes[keyName] != null) {
            return
        }

        if ([37, 38, 39, 40].includes(evt.which)) {
            this._pressedTimes[keyName] = Date.now();
        }
    }

    onKeyUp(evt) {
        const keyName = this._keyCodeToName(evt.which);
        delete this._pressedTimes[keyName];
    }
}