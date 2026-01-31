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

  // Seamless loop settings
  _seamlessX = false;
  _seamlessY = false;
  _mapWidth = 0;
  _mapHeight = 0;

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
   * Configure seamless loop mode
   * @param {boolean} seamlessX - Enable seamless loop on X axis
   * @param {boolean} seamlessY - Enable seamless loop on Y axis
   * @param {number} mapWidth - Map width for X axis wrapping
   * @param {number} mapHeight - Map height for Y axis wrapping
   */
  setSeamlessLoop(seamlessX, seamlessY, mapWidth, mapHeight) {
    this._seamlessX = seamlessX;
    this._seamlessY = seamlessY;
    this._mapWidth = mapWidth;
    this._mapHeight = mapHeight;
  }

  /**
   * Set camera smoothing factor
   * @param {number} smoothing - 0 to 1 (0 = instant, 1 = no movement)
   */
  setSmoothing(smoothing) {
    this._smoothing = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Snap camera to target position immediately (no smoothing)
   */
  snapToTarget() {
    if (!this._target) {
      return;
    }

    this._x = this._getTargetCenterX();
    this._y = this._getTargetCenterY();
    this._targetX = this._x;
    this._targetY = this._y;

    // Normalize for seamless loop
    if (this._seamlessX && this._mapWidth > 0) {
      this._x = this._normalizePosition(this._x, this._bounds?.minX ?? 0, this._mapWidth);
    }
    if (this._seamlessY && this._mapHeight > 0) {
      this._y = this._normalizePosition(this._y, this._bounds?.minY ?? 0, this._mapHeight);
    }
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

    // Calculate delta with seamless loop consideration
    let deltaX = this._targetX - this._x;
    let deltaY = this._targetY - this._y;

    // For seamless loop, find the shortest path
    if (this._seamlessX && this._mapWidth > 0) {
      deltaX = this._shortestDelta(deltaX, this._mapWidth);
    }

    if (this._seamlessY && this._mapHeight > 0) {
      deltaY = this._shortestDelta(deltaY, this._mapHeight);
    }

    // Apply smoothing (lerp)
    this._x += deltaX * (1 - this._smoothing);
    this._y += deltaY * (1 - this._smoothing);

    // Normalize camera position for seamless loop
    if (this._seamlessX && this._mapWidth > 0) {
      this._x = this._normalizePosition(this._x, this._bounds?.minX ?? 0, this._mapWidth);
    }

    if (this._seamlessY && this._mapHeight > 0) {
      this._y = this._normalizePosition(this._y, this._bounds?.minY ?? 0, this._mapHeight);
    }

    // Apply bounds if set (for non-seamless axes)
    if (this._bounds) {
      if (!this._seamlessX) {
        this._x = Math.max(this._bounds.minX, Math.min(this._bounds.maxX, this._x));
      }
      if (!this._seamlessY) {
        this._y = Math.max(this._bounds.minY, Math.min(this._bounds.maxY, this._y));
      }
    }
  }

  /**
   * Find the shortest delta considering wrap-around
   * @param {number} delta - Current delta
   * @param {number} size - Map size (width or height)
   * @returns {number} Shortest delta
   */
  _shortestDelta(delta, size) {
    // If delta is more than half the map size, go the other way
    if (delta > size / 2) {
      return delta - size;
    } else if (delta < -size / 2) {
      return delta + size;
    }
    return delta;
  }

  /**
   * Normalize position to stay within map bounds
   * @param {number} pos - Current position
   * @param {number} min - Minimum bound
   * @param {number} size - Map size
   * @returns {number} Normalized position
   */
  _normalizePosition(pos, min, size) {
    const max = min + size;
    if (pos < min) {
      return pos + size;
    } else if (pos >= max) {
      return pos - size;
    }
    return pos;
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
