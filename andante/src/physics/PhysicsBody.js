/**
 * PhysicsBody - Physics-enabled body with position, velocity, and collision
 */
import { PHYSICS } from '../config/constants.js';

export class PhysicsBody {
  // Current position (bottom-left origin for y)
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  // Previous position (for interpolation)
  _prevX = 0;
  _prevY = 0;

  // Bounding box
  left = 0;
  right = 0;
  top = 0;
  bottom = 0;

  // Next position (pending move)
  _to = {
    x: null,
    y: null,
    width: null,
    height: null,
    left: null,
    right: null,
    top: null,
    bottom: null,
  };

  // Physics properties
  physics = {
    speedX: 0,
    speedY: 0,
    accelerationX: 0,
    accelerationY: 0,
    maxSpeedX: PHYSICS.MAX_SPEED_X,
    movingPowerPerTick: PHYSICS.MOVING_POWER_PER_TICK,
    leftJumpingPower: 0,
    maxJumpingPower: PHYSICS.MAX_JUMPING_POWER,
    jumpingPowerPerTick: PHYSICS.JUMPING_POWER_PER_TICK,
    jumpedAt: null,
    flapped: 0,
    flappable: PHYSICS.FLAPPABLE,
    reflectionDecrement: PHYSICS.REFLECTION_DECREMENT,
    reflectivity: PHYSICS.REFLECTIVITY,
    groundResistivity: PHYSICS.GROUND_RESISTIVITY,
    airResistivity: PHYSICS.AIR_RESISTIVITY,
    groundReflectivity: PHYSICS.GROUND_REFLECTIVITY,
    airReflectivity: PHYSICS.AIR_REFLECTIVITY,
  };

  /**
   * @param {number} x - X position
   * @param {number} y - Y position (bottom of body)
   * @param {number} width
   * @param {number} height
   * @param {Object} physicsOverrides - Override default physics values
   */
  constructor(x, y, width, height, physicsOverrides = {}) {
    this.x = x;
    this.y = y;
    this._prevX = x;
    this._prevY = y;
    this.width = width;
    this.height = height;

    this._updateBoundingBox();

    Object.assign(this.physics, physicsOverrides);
  }

  /**
   * Check if body is in air (jumping)
   * @returns {boolean}
   */
  get isInAir() {
    return this.physics.jumpedAt !== null;
  }

  /**
   * Set next X position
   * @param {number} x
   */
  toX(x) {
    this._to.x = x;
    this._to.y = this._to.y ?? this.y;
    this._to.width = this._to.width ?? this.width;
    this._to.height = this._to.height ?? this.height;
    this._updateToBoundingBox();
  }

  /**
   * Set next Y position
   * @param {number} y
   */
  toY(y) {
    this._to.x = this._to.x ?? this.x;
    this._to.y = y;
    this._to.width = this._to.width ?? this.width;
    this._to.height = this._to.height ?? this.height;
    this._updateToBoundingBox();
  }

  /**
   * Set next X and Y position
   * @param {number} x
   * @param {number} y
   */
  toXY(x, y) {
    this._to.x = x;
    this._to.y = y;
    this._to.width = this._to.width ?? this.width;
    this._to.height = this._to.height ?? this.height;
    this._updateToBoundingBox();
  }

  /**
   * Apply pending position changes
   */
  applyMove() {
    // Save previous position for interpolation
    this._prevX = this.x;
    this._prevY = this.y;

    this.x = this._to.x ?? this.x;
    this.y = this._to.y ?? this.y;
    this.width = this._to.width ?? this.width;
    this.height = this._to.height ?? this.height;

    this._updateBoundingBox();
    this._clearPendingMove();
  }

  /**
   * Get interpolated position for smooth rendering
   * @param {number} alpha - Interpolation factor (0-1)
   * @returns {{ x: number, y: number }}
   */
  getInterpolatedPosition(alpha) {
    return {
      x: this._prevX + (this.x - this._prevX) * alpha,
      y: this._prevY + (this.y - this._prevY) * alpha,
    };
  }

  /**
   * Snap previous position to current (use after teleport/respawn)
   */
  snapPreviousPosition() {
    this._prevX = this.x;
    this._prevY = this.y;
  }

  /**
   * Handle landing on ground
   * @param {number} groundY - Y position of ground
   */
  handleGroundLanding(groundY) {
    this.toY(groundY);
    this.physics.accelerationY = Math.max(
      (Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity,
      0
    );
    this.physics.jumpedAt = null;
    this.physics.flapped = 0; // Reset flap count on landing
  }

  /**
   * Handle landing on top of a box
   * @param {PhysicsBody} box
   */
  handleBoxTopLanding(box) {
    this.toY(box.y - box.height);
    this.physics.accelerationY = Math.max(
      (Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement) * this.physics.reflectivity,
      0
    );
    this.physics.jumpedAt = null;
    this.physics.flapped = 0; // Reset flap count on landing
  }

  /**
   * Handle hitting bottom of a box
   * @param {PhysicsBody} box
   */
  handleBoxBottomHit(box) {
    this.toY(box.y + this._to.height);
    this.physics.accelerationY = -(
      Math.max(Math.abs(this.physics.accelerationY) - this.physics.reflectionDecrement, 0) * this.physics.reflectivity
    );
    this.physics.speedY = -this.physics.speedY * this.physics.reflectivity;
    this.physics.leftJumpingPower = 0;
  }

  /**
   * Handle hitting left side of a box (body moving right)
   * @param {PhysicsBody} box
   */
  handleBoxLeftHit(box) {
    this.toX(box.x - this._to.width);
    this._applyHorizontalReflection();
  }

  /**
   * Handle hitting right side of a box (body moving left)
   * @param {PhysicsBody} box
   */
  handleBoxRightHit(box) {
    this.toX(box.x + box.width);
    this._applyHorizontalReflection();
  }

  /**
   * Handle falling off a platform
   */
  handleFall() {
    if (this.physics.jumpedAt === null) {
      this.physics.jumpedAt = Date.now();
      this.physics.flapped = 0;
    }
  }

  /**
   * Update bounding box from current position
   */
  _updateBoundingBox() {
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y - this.height;
    this.bottom = this.y;
  }

  /**
   * Update pending bounding box
   */
  _updateToBoundingBox() {
    this._to.left = this._to.x;
    this._to.right = this._to.x + this._to.width;
    this._to.top = this._to.y - this._to.height;
    this._to.bottom = this._to.y;
  }

  /**
   * Clear pending move data
   */
  _clearPendingMove() {
    this._to.x = null;
    this._to.y = null;
    this._to.width = null;
    this._to.height = null;
    this._to.left = null;
    this._to.right = null;
    this._to.top = null;
    this._to.bottom = null;
  }

  /**
   * Apply horizontal reflection based on air/ground state
   */
  _applyHorizontalReflection() {
    const reflectivity = this.isInAir ? this.physics.airReflectivity : this.physics.groundReflectivity;

    this.physics.speedX = -this.physics.speedX * reflectivity;
    this.physics.accelerationX = -this.physics.accelerationX * reflectivity;
  }
}
