/**
 * Camera - Camera system for following targets and viewport management
 */
import { CAMERA } from '../config/constants.js';

export class Camera {
  _x = 0;
  _y = 0;
  _targetX = 0;
  _targetY = 0;

  _target = null;
  _followOffsetX = 0;
  _followOffsetY = 0;
  _smoothing = CAMERA.SMOOTHING;

  _bounds = null; // { minX, maxX, minY, maxY }

  constructor(options = {}) {
    this._smoothing = options.smoothing ?? CAMERA.SMOOTHING;
    this._followOffsetX = options.offsetX ?? CAMERA.OFFSET_X;
    this._followOffsetY = options.offsetY ?? CAMERA.OFFSET_Y;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  /**
   * Set the target entity for the camera to follow
   * @param {Entity} target - Entity with x, y, width, height properties
   * @param {Object} options - { offsetX, offsetY }
   */
  setTarget(target, options = {}) {
    this._target = target;
    this._followOffsetX = options.offsetX ?? this._followOffsetX;
    this._followOffsetY = options.offsetY ?? this._followOffsetY;

    // Snap to target immediately
    if (target) {
      this._x = this._getTargetCenterX();
      this._y = this._getTargetCenterY();
      this._targetX = this._x;
      this._targetY = this._y;
    }
  }

  /**
   * Set camera bounds (optional)
   * @param {Object} bounds - { minX, maxX, minY, maxY }
   */
  setBounds(bounds) {
    this._bounds = bounds;
  }

  /**
   * Clear camera bounds
   */
  clearBounds() {
    this._bounds = null;
  }

  /**
   * Set camera smoothing factor
   * @param {number} smoothing - 0 to 1 (0 = instant, 1 = no movement)
   */
  setSmoothing(smoothing) {
    this._smoothing = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Update camera position (called every frame)
   */
  update() {
    if (!this._target) {
      return;
    }

    // Calculate target position
    this._targetX = this._getTargetCenterX();
    this._targetY = this._getTargetCenterY();

    // Apply smoothing (lerp)
    this._x += (this._targetX - this._x) * (1 - this._smoothing);
    this._y += (this._targetY - this._y) * (1 - this._smoothing);

    // Apply bounds if set
    if (this._bounds) {
      this._x = Math.max(this._bounds.minX, Math.min(this._bounds.maxX, this._x));
      this._y = Math.max(this._bounds.minY, Math.min(this._bounds.maxY, this._y));
    }
  }

  /**
   * Apply camera transform to canvas context
   * @param {CanvasRenderingContext2D} context
   */
  applyTransform(context) {
    context.translate(-this._x, -this._y);
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX
   * @param {number} screenY
   * @returns {{ x: number, y: number }}
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this._x,
      y: screenY + this._y,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX
   * @param {number} worldY
   * @returns {{ x: number, y: number }}
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this._x,
      y: worldY - this._y,
    };
  }

  /**
   * Check if a rectangle is visible in the camera viewport
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {Object} viewport - { width, height }
   * @returns {boolean}
   */
  isVisible(x, y, width, height, viewport) {
    const halfWidth = viewport.width / 2;
    const halfHeight = viewport.height / 2;

    return (
      x + width > this._x - halfWidth &&
      x < this._x + halfWidth &&
      y + height > this._y - halfHeight &&
      y < this._y + halfHeight
    );
  }

  /**
   * Get target's center X position with offset
   * @returns {number}
   */
  _getTargetCenterX() {
    return this._target.x + this._target.width / 2 + this._followOffsetX;
  }

  /**
   * Get target's center Y position with offset
   * @returns {number}
   */
  _getTargetCenterY() {
    return this._target.y - this._target.height / 2 + this._followOffsetY;
  }
}
