class DefaultCanvasView {
    _canvas = null;
    _context = null;

    _playing = false;

    _width = 0;
    _height = 0;
    _scale = 1;
    _scaledHalfWidth = 0;
    _scaledHalfHeight = 0;
    _boundary = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    };

    _renderer;
    _joypad;

    _onComputeListener;
    _onRenderListener;

    constructor(canvas) {
        console.log("initialize");

        this._canvas = canvas;
        this._context = canvas.getContext("2d");
        this._context.imageSmoothingEnabled = false;

        // Autoplay
        this.play();

        canvas.addEventListener("mousedown", (evt) => this._onPointersDown(evt));
        canvas.addEventListener("mousemove", (evt) => this._onPointersMove(evt));
        canvas.addEventListener("mouseup", (evt) => this._onPointersUp(evt));
        canvas.addEventListener("mouseout", (evt) => this._onPointersUp(evt));
        canvas.addEventListener("mouseleave", (evt) => this._onPointersUp(evt));
        canvas.addEventListener("touchstart", (evt) => this._onPointersDown(evt));
        canvas.addEventListener("touchmove", (evt) => this._onPointersMove(evt));
        canvas.addEventListener("touchend", (evt) => this._onPointersUp(evt));
        document.body.addEventListener("keydown", (evt) => this._onKeyDown(evt));
        document.body.addEventListener("keyup", (evt) => this._onKeyUp(evt));
    }

    setRenderer(renderer) {
        this._renderer = renderer;
    }

    setJoypad(joypad) {
        this._joypad = joypad;
    }

    setOnComputeListener(onComputeListener) {
        this._onComputeListener = onComputeListener;
    }

    setOnRenderListener(onRenderListener) {
        this._onRenderListener = onRenderListener;
    }

    play() {
        console.log("play");

        if (this._playing) return;
        this._playing = true;
        this._requestLoop(this._context);
    }

    stop() {
        console.log("stop");

        if (!this._playing) return;
        this._playing = false;
    }

    destroy() {
        console.log("destroy");

        this._playing = false;

        // Destroy All Objects
    }

    _requestLoop(context) {
        window.requestAnimationFrame(() => {
            this._compute();

            this._render(context);

            if (this._playing) {
                this._requestLoop(context);
            }
        });
    }

    _compute() {
        this._scale = (this._canvas.clientWidth * this._canvas.clientHeight > 800 * 600) ? 1 : 2;

        this._canvas.width = this._canvas.clientWidth * this._scale;
        this._canvas.height = this._canvas.clientHeight * this._scale;

        this._width = this._canvas.width;
        this._height = this._canvas.height;
        this._scaledHalfWidth = this._width / 2 / this._scale;
        this._scaledHalfHeight = this._height / 2 / this._scale;
        this._boundary = {
            left: -this._width / 2 / this._scale,
            right: this._width / 2 / this._scale,
            top: -this._height / 2 / this._scale,
            bottom: this._height / 2 / this._scale
        };

        this._joypad && this._joypad.setCanvasSize(this._canvas.width, this._canvas.height, this._scale);

        const status = {
            joypad: this._joypad && this._joypad.getStatus(),
            boundary: this._boundary
        };

        this._renderer && this._renderer.compute(status);
        this._onComputeListener && this._onComputeListener(status);
        this._joypad && this._joypad.compute(status);
    }

    _render(context) {
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        context.scale(this._scale, this._scale);
        context.translate(this._scaledHalfWidth, this._scaledHalfHeight);

        const status = {
            joypad: this._joypad && this._joypad.getStatus(),
            boundary: this._boundary
        };

        this._renderer && this._renderer.render(context, status);
        this._onRenderListener && this._onRenderListener(context, status);
        this._joypad && this._joypad.render(context, status);
    }

    _getPointers(evt) {
        var touches = evt.targetTouches ? evt.targetTouches : [evt];
        const pointers = [];
        for (var i = 0; i < touches.length; i++) {
            pointers.push({
                x: touches[i].pageX,
                y: touches[i].pageY,
                id: touches[i].identifier
            });
        }
        return pointers;
    }

    _onPointersDown(evt) {
        if (evt.type == "touchstart") {
            evt.preventDefault(); // for Mobile
        }

        var pointers = this._getPointers(evt);

        if (this._joypad) {
            this._joypad.onPointersDown(pointers);
        }
    }

    _onPointersMove(evt) {
        var pointers = this._getPointers(evt);

        if (this._joypad) {
            this._joypad.onPointersMove(pointers);
        }
    }

    _onPointersUp(evt) {
        var pointers = this._getPointers(evt);

        if (this._joypad) {
            this._joypad.onPointersUp(pointers);
        }
    }

    _onKeyDown(evt) {
        if (this._joypad) {
            this._joypad.onKeyDown(evt.which);
        }
    }

    _onKeyUp(evt) {
        if (this._joypad) {
            this._joypad.onKeyUp(evt.which);
        }
    }
}