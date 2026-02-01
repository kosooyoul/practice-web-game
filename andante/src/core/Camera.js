/**
 * Camera - Camera system for following targets and viewport management
 */
import { CAMERA, TIMING } from '../config/constants.js';

export class Camera {
  _x = 0;
  _y = 0;
  _prevX = 0;
  _prevY = 0;
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
   * Set camera follow offset
   * @param {number} offsetX
   * @param {number} offsetY
   */
  setOffset(offsetX, offsetY) {
    this._followOffsetX = offsetX;
    this._followOffsetY = offsetY;
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

    // Snap previous position too (no interpolation after snap)
    this._prevX = this._x;
    this._prevY = this._y;
  }

  /**
   * Adjust camera position by offset (for smooth transitions)
   * @param {number} offsetX
   * @param {number} offsetY
   */
  adjustPosition(offsetX, offsetY) {
    this._prevX = this._x;
    this._prevY = this._y;
    this._x += offsetX;
    this._y += offsetY;
    this._targetX = this._x;
    this._targetY = this._y;
  }

  /**
   * Update camera position (called every fixed timestep)
   * @param {number} deltaTime - Delta time in seconds (optional, defaults to fixed timestep)
   */
  update(deltaTime) {
    if (!this._target) {
      return;
    }

    // Save previous position for interpolation
    this._prevX = this._x;
    this._prevY = this._y;

    // Use fixed timestep if no deltaTime provided
    const dt = deltaTime ?? (TIMING.FIXED_TIMESTEP / 1000);

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

    // Apply smoothing (lerp) - frame-rate independent
    // Convert smoothing factor to work with deltaTime
    // smoothingFactor = 1 - smoothing^(dt * 60) to normalize to 60fps
    const smoothFactor = 1 - Math.pow(this._smoothing, dt * 60);
    this._x += deltaX * smoothFactor;
    this._y += deltaY * smoothFactor;

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
   * Get interpolated position for smooth rendering
   * @param {number} alpha - Interpolation factor (0-1)
   * @returns {{ x: number, y: number }}
   */
  getInterpolatedPosition(alpha) {
    let interpX = this._prevX + (this._x - this._prevX) * alpha;
    let interpY = this._prevY + (this._y - this._prevY) * alpha;

    // Handle seamless loop wraparound for interpolation
    if (this._seamlessX && this._mapWidth > 0) {
      const deltaX = this._x - this._prevX;
      if (Math.abs(deltaX) > this._mapWidth / 2) {
        // Crossed boundary, don't interpolate
        interpX = this._x;
      }
    }

    if (this._seamlessY && this._mapHeight > 0) {
      const deltaY = this._y - this._prevY;
      if (Math.abs(deltaY) > this._mapHeight / 2) {
        interpY = this._y;
      }
    }

    return { x: interpX, y: interpY };
  }

  /**
   * Snap previous position to current (use after teleport/respawn)
   */
  snapPreviousPosition() {
    this._prevX = this._x;
    this._prevY = this._y;
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
  /**
   * Apply camera transform to canvas context
   * @param {CanvasRenderingContext2D} context
   * @param {number} interpolation - Optional interpolation factor (0-1) for smooth rendering
   */
  applyTransform(context, interpolation = 1) {
    if (interpolation < 1) {
      const { x, y } = this.getInterpolatedPosition(interpolation);
      context.translate(-x, -y);
    } else {
      context.translate(-this._x, -this._y);
    }
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
