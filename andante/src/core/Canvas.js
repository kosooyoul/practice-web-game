/**
 * Canvas - Canvas and rendering context management
 */
export class Canvas {
  _canvas = null;
  _context = null;
  _scale = 1;

  _width = 0;
  _height = 0;
  _scaledHalfWidth = 0;
  _scaledHalfHeight = 0;

  _boundary = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  };

  constructor(canvasElement) {
    this._canvas = canvasElement;
    this._context = canvasElement.getContext('2d');
    this._context.imageSmoothingEnabled = false;
  }

  get element() {
    return this._canvas;
  }

  get context() {
    return this._context;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get scale() {
    return this._scale;
  }

  get boundary() {
    return this._boundary;
  }

  /**
   * Update canvas dimensions based on client size
   */
  updateDimensions() {
    const clientWidth = this._canvas.clientWidth;
    const clientHeight = this._canvas.clientHeight;

    this._scale = clientWidth * clientHeight > 800 * 600 ? 1 : 2;

    this._canvas.width = clientWidth * this._scale;
    this._canvas.height = clientHeight * this._scale;

    this._width = this._canvas.width;
    this._height = this._canvas.height;
    this._scaledHalfWidth = this._width / 2 / this._scale;
    this._scaledHalfHeight = this._height / 2 / this._scale;

    this._boundary = {
      left: -this._scaledHalfWidth,
      right: this._scaledHalfWidth,
      top: -this._scaledHalfHeight,
      bottom: this._scaledHalfHeight,
    };
  }

  /**
   * Clear canvas and set up transform for centered coordinate system
   */
  clear() {
    this._context.clearRect(0, 0, this._width, this._height);
    this._context.save();
    this._context.scale(this._scale, this._scale);
    this._context.translate(this._scaledHalfWidth, this._scaledHalfHeight);
  }

  /**
   * Restore canvas transform
   */
  restore() {
    this._context.restore();
  }
}
