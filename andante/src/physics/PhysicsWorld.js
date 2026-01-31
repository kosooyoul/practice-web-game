/**
 * PhysicsWorld - Physics simulation environment
 */
import { ENVIRONMENT } from '../config/constants.js';

export class PhysicsWorld {
  _gravity = ENVIRONMENT.GRAVITY;
  _loopX = ENVIRONMENT.LOOP_X;

  constructor(options = {}) {
    this._gravity = options.gravity ?? ENVIRONMENT.GRAVITY;
    this._loopX = options.loopX ?? ENVIRONMENT.LOOP_X;
  }

  get gravity() {
    return this._gravity;
  }

  get loopX() {
    return this._loopX;
  }

  /**
   * Apply horizontal movement to a body
   * @param {PhysicsBody} body
   * @param {Object} input - Input status {left, right}
   * @param {Object} boundary - Screen boundary
   */
  applyHorizontalMovement(body, input, boundary) {
    // Apply input acceleration
    if (input['left']) {
      body.physics.accelerationX = Math.min(body.physics.accelerationX - body.physics.movingPowerPerTick, 0);
    } else if (input['right']) {
      body.physics.accelerationX = Math.max(body.physics.accelerationX + body.physics.movingPowerPerTick, 0);
    } else {
      body.physics.accelerationX = 0;

      // Apply friction/resistance
      const resistivity = body.isInAir ? body.physics.airResistivity : body.physics.groundResistivity;
      body.physics.speedX += (0 - body.physics.speedX) * resistivity;
    }

    // Apply speed limits
    body.physics.speedX = Math.max(
      Math.min(body.physics.speedX + body.physics.accelerationX, body.physics.maxSpeedX),
      -body.physics.maxSpeedX
    );

    // Calculate next X position
    let nextX = body.x + body.physics.speedX;

    // Apply horizontal looping
    if (this._loopX) {
      if (nextX < boundary.left - body.width) {
        nextX = boundary.right;
      } else if (nextX > boundary.right) {
        nextX = boundary.left - body.width;
      }
    }

    body.toX(nextX);
  }

  /**
   * Apply vertical movement (jumping/falling) to a body
   * @param {PhysicsBody} body
   * @param {Object} input - Input status {action}
   * @param {number|null} lockedJumpAt - Timestamp when jump was locked
   * @returns {number|null} Updated lockedJumpAt
   */
  applyVerticalMovement(body, input, lockedJumpAt) {
    let newLockedJumpAt = lockedJumpAt;

    if (input['action']) {
      // Check if jump is locked
      if (lockedJumpAt !== null) {
        if (input['action'] > lockedJumpAt) {
          newLockedJumpAt = null;
        }
      }

      if (newLockedJumpAt !== null) {
        // Jump is locked, do nothing
      } else if (body.physics.jumpedAt === null) {
        // Start new jump
        body.physics.flapped = 0;
        body.physics.jumpedAt = Date.now();
        body.physics.leftJumpingPower = body.physics.maxJumpingPower;
        body.physics.speedY = 0;
        body.physics.accelerationY = 0;
      } else if (body.physics.flapped < body.physics.flappable) {
        // Double jump / flap
        if (input['action'] > body.physics.jumpedAt) {
          body.physics.flapped++;
          body.physics.jumpedAt = Date.now();
          body.physics.leftJumpingPower = body.physics.maxJumpingPower;
          body.physics.accelerationY = 0;
        }
      }
    } else {
      body.physics.leftJumpingPower = 0;
    }

    // Apply jumping power
    if (body.physics.leftJumpingPower > 0) {
      body.physics.accelerationY += body.physics.jumpingPowerPerTick;
      body.physics.leftJumpingPower -= body.physics.jumpingPowerPerTick;
    }

    // Apply gravity and calculate speed
    body.physics.speedY = -body.physics.accelerationY;
    body.physics.accelerationY -= this._gravity - body.physics.airResistivity;

    // Calculate next Y position
    const nextY = body.y + body.physics.speedY;
    body.toY(nextY);

    return newLockedJumpAt;
  }
}
