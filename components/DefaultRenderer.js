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

    _quality = 1;

    _onComputeListener;
    _onRenderListener;

    constructor() {

    }

    setCanvasSize(w, h) {
        this.canvasSize.w = w;
        this.canvasSize.h = h;

        this._boundary = {
            left: -this.canvasSize.w / 2 / this._quality,
            top: -this.canvasSize.h / 2 / this._quality,
            right: this.canvasSize.w / 2 / this._quality,
            bottom: this.canvasSize.h / 2 / this._quality
        };
    }

    setQuality(quality) {
        this._quality = quality;
    }

    setOnComputeListener(onComputeListener) {
        this._onComputeListener = onComputeListener;
    }

    setOnRenderListener(onRenderListener) {
        this._onRenderListener = onRenderListener;
    }

    compute() {

    }

    render(context, status) {
        this._compute(status);

        this._clearCanvas(context);

        this._render(context, status);
    }

    _clearCanvas(context) {
        context.clearRect(0, 0, this.canvasSize.w, this.canvasSize.h);
    }

    _compute(status) {
        this._onComputeListener && this._onComputeListener(this._boundary, status);
    }

    _render(context, status) {
        context.save();
        context.translate(this.canvasSize.w >> 1, this.canvasSize.h >> 1);
        context.scale(this._quality, this._quality);

        this._onRenderListener && this._onRenderListener(context, this._boundary);

        this._renderTouchInterface(context, status);

        context.restore();
    }

    _renderTouchInterface(context, status) {
        if (status.downedCursor) {
            // Left
            context.beginPath();
            context.fillStyle = status.keyTimes["left"] ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
            context.strokeStyle = "rgba(220, 220, 220, 0.4)";
            context.moveTo(status.downedCursor.x - 28.28, status.downedCursor.y + 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 30, Math.PI * 0.75, Math.PI * 1.25);
            context.lineTo(status.downedCursor.x - 28.28, status.downedCursor.y - 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 40, Math.PI * 1.25, Math.PI * 0.75, true);
            context.fill();
            context.stroke();

            // Right
            context.beginPath();
            context.fillStyle = status.keyTimes["right"] ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
            context.strokeStyle = "rgba(220, 220, 220, 0.4)";
            context.moveTo(status.downedCursor.x + 28.28, status.downedCursor.y - 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 30, Math.PI * 1.75, Math.PI * 2.25);
            context.lineTo(status.downedCursor.x + 28.28, status.downedCursor.y + 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 40, Math.PI * 2.25, Math.PI * 1.75, true);
            context.fill();
            context.stroke();

            // Up
            context.beginPath();
            context.fillStyle = status.keyTimes["up"] ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
            context.strokeStyle = "rgba(220, 220, 220, 0.4)";
            context.moveTo(status.downedCursor.x - 28.28, status.downedCursor.y - 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 30, Math.PI * 1.25, Math.PI * 1.75);
            context.lineTo(status.downedCursor.x + 28.28, status.downedCursor.y - 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 40, Math.PI * 1.75, Math.PI * 1.25, true);
            context.fill();
            context.stroke();

            // Down
            context.beginPath();
            context.fillStyle = status.keyTimes["down"] ? "rgba(127, 0, 127, 0.2)" : "rgba(127, 127, 127, 0.2)";
            context.strokeStyle = "rgba(220, 220, 220, 0.4)";
            context.moveTo(status.downedCursor.x + 28.28, status.downedCursor.y + 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 30, Math.PI * 0.25, Math.PI * 0.75);
            context.lineTo(status.downedCursor.x - 28.28, status.downedCursor.y + 28.28);
            context.arc(status.downedCursor.x, status.downedCursor.y, 40, Math.PI * 0.75, Math.PI * 0.25, true);
            context.fill();
            context.stroke();
        }

        if (status.movingCursor) {
            context.beginPath();
            context.fillStyle = "rgba(127, 127, 127, 0.2)";
            context.strokeStyle = "rgba(220, 220, 220, 0.4)";
            context.arc(status.movingCursor.x, status.movingCursor.y, 20, 0, Math.PI * 2);
            context.fill();
            context.stroke();
        }
    }
}