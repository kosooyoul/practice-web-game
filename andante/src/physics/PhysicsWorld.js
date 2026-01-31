/**
 * PhysicsWorld - Physics simulation environment
 */
import { ENVIRONMENT, BOUNDARY_TYPE } from '../config/constants.js';

export class PhysicsWorld {
  _gravity = ENVIRONMENT.GRAVITY;

  constructor(options = {}) {
    this._gravity = options.gravity ?? ENVIRONMENT.GRAVITY;
  }

  get gravity() {
    return this._gravity;
  }

  /**
   * Apply horizontal movement to a body
   * @param {PhysicsBody} body
   * @param {Object} input - Input status {left, right}
   * @param {Object} mapBounds - Map bounds with boundary types
   * @returns {{ left: boolean, right: boolean }} Boundary hit status
   */
  applyHorizontalMovement(body, input, mapBounds) {
    const boundaryHit = { left: false, right: false };

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

    // Handle left boundary
    if (nextX < mapBounds.MIN_X) {
      boundaryHit.left = true;
      nextX = this._applyHorizontalBoundary(body, nextX, mapBounds, 'LEFT');
    }

    // Handle right boundary
    if (nextX + body.width > mapBounds.MAX_X) {
      boundaryHit.right = true;
      nextX = this._applyHorizontalBoundary(body, nextX, mapBounds, 'RIGHT');
    }

    body.toX(nextX);

    return boundaryHit;
  }

  /**
   * Apply horizontal boundary behavior
   * @param {PhysicsBody} body
   * @param {number} nextX
   * @param {Object} mapBounds
   * @param {string} side - 'LEFT' or 'RIGHT'
   * @returns {number} Adjusted X position
   */
  _applyHorizontalBoundary(body, nextX, mapBounds, side) {
    const boundaryType = mapBounds[side];

    switch (boundaryType) {
      case BOUNDARY_TYPE.BLOCK:
        if (side === 'LEFT') {
          nextX = mapBounds.MIN_X;
        } else {
          nextX = mapBounds.MAX_X - body.width;
        }
        body.physics.speedX = 0;
        body.physics.accelerationX = 0;
        break;

      case BOUNDARY_TYPE.LOOP:
        if (side === 'LEFT') {
          nextX = mapBounds.MAX_X - body.width;
        } else {
          nextX = mapBounds.MIN_X;
        }
        break;

      case BOUNDARY_TYPE.NONE:
      case BOUNDARY_TYPE.RESPAWN:
        // No position adjustment, let it go beyond
        break;
    }

    return nextX;
  }

  /**
   * Apply vertical movement (jumping/falling) to a body
   * @param {PhysicsBody} body
   * @param {Object} input - Input status {action}
   * @param {number|null} lockedJumpAt - Timestamp when jump was locked
   * @param {Object} mapBounds - Map bounds with boundary types
   * @returns {{ lockedJumpAt: number|null, top: boolean, bottom: boolean }}
   */
  applyVerticalMovement(body, input, lockedJumpAt, mapBounds = null) {
    let newLockedJumpAt = lockedJumpAt;
    const boundaryHit = { top: false, bottom: false };

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
    let nextY = body.y + body.physics.speedY;

    // Apply vertical boundaries if mapBounds is set
    if (mapBounds) {
      // Top boundary (ceiling)
      if (nextY - body.height < mapBounds.MIN_Y) {
        boundaryHit.top = true;
        nextY = this._applyVerticalBoundary(body, nextY, mapBounds, 'TOP');
      }

      // Bottom boundary (fall)
      if (nextY > mapBounds.MAX_Y + 100) { // Buffer for falling animation
        boundaryHit.bottom = true;
        // Don't adjust position here, let GameScene handle respawn
      }
    }

    body.toY(nextY);

    return { lockedJumpAt: newLockedJumpAt, ...boundaryHit };
  }

  /**
   * Apply vertical boundary behavior
   * @param {PhysicsBody} body
   * @param {number} nextY
   * @param {Object} mapBounds
   * @param {string} side - 'TOP' or 'BOTTOM'
   * @returns {number} Adjusted Y position
   */
  _applyVerticalBoundary(body, nextY, mapBounds, side) {
    const boundaryType = mapBounds[side];

    switch (boundaryType) {
      case BOUNDARY_TYPE.BLOCK:
        if (side === 'TOP') {
          nextY = mapBounds.MIN_Y + body.height;
          body.physics.accelerationY = 0;
          body.physics.speedY = 0;
          body.physics.leftJumpingPower = 0;
        } else {
          nextY = mapBounds.MAX_Y;
          body.physics.accelerationY = 0;
          body.physics.speedY = 0;
        }
        break;

      case BOUNDARY_TYPE.LOOP:
        if (side === 'TOP') {
          nextY = mapBounds.MAX_Y;
        } else {
          nextY = mapBounds.MIN_Y + body.height;
        }
        break;

      case BOUNDARY_TYPE.NONE:
      case BOUNDARY_TYPE.RESPAWN:
        // No position adjustment
        break;
    }

    return nextY;
  }

  /**
   * Check if body needs respawn based on boundary type
   * @param {PhysicsBody} body
   * @param {Object} mapBounds
   * @returns {{ needsRespawn: boolean, reason: string|null }}
   */
  checkBoundaryRespawn(body, mapBounds) {
    // Check left
    if (body.x < mapBounds.MIN_X - body.width && mapBounds.LEFT === BOUNDARY_TYPE.RESPAWN) {
      return { needsRespawn: true, reason: 'left' };
    }

    // Check right
    if (body.x > mapBounds.MAX_X && mapBounds.RIGHT === BOUNDARY_TYPE.RESPAWN) {
      return { needsRespawn: true, reason: 'right' };
    }

    // Check top
    if (body.y - body.height < mapBounds.MIN_Y - 100 && mapBounds.TOP === BOUNDARY_TYPE.RESPAWN) {
      return { needsRespawn: true, reason: 'top' };
    }

    // Check bottom
    if (body.y > mapBounds.MAX_Y + 100 && mapBounds.BOTTOM === BOUNDARY_TYPE.RESPAWN) {
      return { needsRespawn: true, reason: 'bottom' };
    }

    return { needsRespawn: false, reason: null };
  }
}
