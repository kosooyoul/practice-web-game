class DefaultRenderer {
    canvasSize = {
        w: 0,
        h: 0
    };

    _boundary = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    }

    quality = 1;

    _onComputeListener;
    _onRenderListener;

    constructor() {

    }

    setCanvasSize(w, h) {
        this.canvasSize.w = w;
        this.canvasSize.h = h;

        this._boundary = {
            left: -this.canvasSize.w >> 1,
            top: -this.canvasSize.h >> 1,
            right: this.canvasSize.w >> 1,
            bottom: this.canvasSize.h >> 1
        };
    }

    setQuality(quality) {
        this.quality = quality;
    }

    setOnComputeListener(onComputeListener) {
        this._onComputeListener = onComputeListener;
    }

    setOnRenderListener(onRenderListener) {
        this._onRenderListener = onRenderListener;
    }

    compute() {

    }

    render(context) {
        this._clearCanvas(context);

        this._render(context);
    }

    _clearCanvas(context) {
        context.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
    }

    _render(context) {
        this._onComputeListener && this._onComputeListener(this._boundary);

        context.save();
        context.translate(this.canvasSize.w >> 1, this.canvasSize.h >> 1);
        context.scale(this.quality, this.quality);

        this._onRenderListener && this._onRenderListener(context, this._boundary);

        context.restore();
    }
}