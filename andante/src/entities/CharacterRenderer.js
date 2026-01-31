/**
 * CharacterRenderer - Renders animated character with body parts
 * Handles walking animation, direction, and SVG asset rendering
 */
import { PendulumMotion } from '../animation/PendulumMotion.js';
import { AssetManager } from '../assets/AssetManager.js';

/**
 * Air state enum
 */
export const AirState = {
  GROUNDED: 'grounded',
  RISING: 'rising',
  FALLING: 'falling',
};

export class CharacterRenderer {
  _direction = 'right';
  _isMoving = false;
  _airState = AirState.GROUNDED;

  // Pendulum motions for each body part
  _head = null;
  _body = null;
  _arm = null;
  _leg = null;

  // Jump animation angles (target values for smooth interpolation)
  _jumpHeadAngle = 0;
  _jumpArmAngle = 0;
  _jumpLegAngle = 0;
  _jumpBodyAngle = 0;

  // Character dimensions (relative to physics body)
  _scale = 1;

  // Debug mode to show collision box
  _showCollisionBox = false;

  constructor() {
    // Initialize pendulum motions for each body part
    // Values tuned for smooth walking animation
    this._head = new PendulumMotion(-0.8 / Math.PI / 2, 0.8 / Math.PI / 2, 0.1 / Math.PI / 2, -1 / Math.PI / 2);
    this._body = new PendulumMotion(-0.8 / Math.PI / 2, 0.8 / Math.PI / 2, 0.1 / Math.PI / 2);
    this._arm = new PendulumMotion(-4 / Math.PI / 2, 4 / Math.PI / 2, 0.4 / Math.PI / 2);
    this._leg = new PendulumMotion(-6 / Math.PI / 2, 6 / Math.PI / 2, 0.6 / Math.PI / 2);
  }

  /**
   * Update animation state based on input and physics
   * @param {Object} input - Input state {left, right, up, action}
   * @param {boolean} isInAir - Whether character is in air
   * @param {number} velocityY - Vertical velocity (negative = rising, positive = falling)
   */
  update(input, isInAir = false, velocityY = 0) {
    // Determine direction and movement state
    if (input.right) {
      this._direction = 'right';
      this._isMoving = true;
    } else if (input.left) {
      this._direction = 'left';
      this._isMoving = true;
    } else {
      this._isMoving = false;
    }

    // Determine air state
    // velocityY > 0 means rising (jumping up), velocityY < 0 means falling
    if (isInAir) {
      this._airState = velocityY > 0 ? AirState.RISING : AirState.FALLING;
    } else {
      this._airState = AirState.GROUNDED;
    }

    // Update animations based on state
    const reverse = this._direction === 'left';

    if (this._airState === AirState.GROUNDED) {
      // Ground animations - pendulum walk cycle
      this._head.compute(this._isMoving, reverse);
      this._body.compute(this._isMoving, reverse);
      this._arm.compute(this._isMoving, reverse);
      this._leg.compute(this._isMoving, reverse);

      // Reset jump angles smoothly
      this._jumpHeadAngle += (0 - this._jumpHeadAngle) * 0.3;
      this._jumpArmAngle += (0 - this._jumpArmAngle) * 0.3;
      this._jumpLegAngle += (0 - this._jumpLegAngle) * 0.3;
      this._jumpBodyAngle += (0 - this._jumpBodyAngle) * 0.3;
    } else {
      // Air animations - pose based on rising/falling
      this._updateAirAnimation(velocityY);
    }
  }

  /**
   * Render character at given position
   * @param {CanvasRenderingContext2D} context
   * @param {number} x - Bottom-left X position
   * @param {number} y - Bottom Y position (ground level)
   * @param {number} width - Physics body width
   * @param {number} height - Physics body height
   */
  render(context, x, y, width, height) {
    context.save();

    // Translate to character position (bottom-left of physics body)
    // Character sprite is drawn from top-left, so adjust Y
    context.translate(x, y - height);

    // Scale based on physics body size
    // Original character design is 30x60, scale to fit current body
    const scaleX = width / 30;
    const scaleY = height / 60;
    this._scale = Math.min(scaleX, scaleY);

    context.scale(this._scale, this._scale);

    // Debug: show collision box
    if (this._showCollisionBox) {
      this._renderCollisionBox(context, 30, 60);
    }

    // Render character parts in correct order (back to front)
    const reverse = this._direction === 'left';
    this._renderLeftLeg(context, reverse);
    this._renderLeftArm(context, reverse);
    this._renderRightLeg(context, reverse);
    this._renderBody(context, reverse);
    this._renderHead(context, reverse);
    this._renderRightArm(context, reverse);

    context.restore();
  }

  /**
   * Set debug mode
   * @param {boolean} show
   */
  setShowCollisionBox(show) {
    this._showCollisionBox = show;
  }

  /**
   * Get current direction
   * @returns {string} 'left' or 'right'
   */
  get direction() {
    return this._direction;
  }

  /**
   * Get movement state
   * @returns {boolean}
   */
  get isMoving() {
    return this._isMoving;
  }

  /**
   * Get air state
   * @returns {string} AirState value
   */
  get airState() {
    return this._airState;
  }

  // --- Private animation methods ---

  /**
   * Update animation for air state (jumping/falling)
   * @param {number} velocityY - Vertical velocity
   */
  _updateAirAnimation(velocityY) {
    const factor = 0.25; // Smooth interpolation factor

    if (this._airState === AirState.RISING) {
      // Rising: arms swept back like skydiving, legs trailing back, body forward, head looking up
      const targetHeadAngle = -0.25; // Head looking up
      const targetArmAngle = 1.0; // Arms swept back strongly
      const targetLegAngle = 0.4; // Legs trailing back
      const targetBodyAngle = 0.15; // Body leaning forward

      this._jumpHeadAngle += (targetHeadAngle - this._jumpHeadAngle) * factor;
      this._jumpArmAngle += (targetArmAngle - this._jumpArmAngle) * factor;
      this._jumpLegAngle += (targetLegAngle - this._jumpLegAngle) * factor;
      this._jumpBodyAngle += (targetBodyAngle - this._jumpBodyAngle) * factor;
    } else {
      // Falling: arms up/forward, legs tucked back, body upright, head looking down
      const targetHeadAngle = 0.2; // Head looking down
      const targetArmAngle = -2.6; // Arms raised forward
      const targetLegAngle = 0.3; // Legs tucked back
      const targetBodyAngle = -0.1; // Body tilted back slightly

      this._jumpHeadAngle += (targetHeadAngle - this._jumpHeadAngle) * factor;
      this._jumpArmAngle += (targetArmAngle - this._jumpArmAngle) * factor;
      this._jumpLegAngle += (targetLegAngle - this._jumpLegAngle) * factor;
      this._jumpBodyAngle += (targetBodyAngle - this._jumpBodyAngle) * factor;
    }

    // Reset pendulum walk motions when in air
    this._head.angle += (0 - this._head.angle) * factor;
    this._body.angle += (this._jumpBodyAngle - this._body.angle) * factor;
    this._arm.angle += (0 - this._arm.angle) * factor;
    this._leg.angle += (0 - this._leg.angle) * factor;
  }

  // --- Private render methods ---

  _renderCollisionBox(context, width, height) {
    context.strokeStyle = 'red';
    context.strokeRect(0, 0, width, height);
  }

  _renderLeftLeg(context, reverse) {
    context.save();

    context.translate(15, 42);

    // Apply walk cycle + jump pose
    const walkAngle = -this._leg.angle;
    // In air: both legs trail back (same direction based on facing)
    const directionMultiplier = reverse ? -1 : 1;
    const jumpAngle = this._airState !== AirState.GROUNDED ? this._jumpLegAngle * directionMultiplier : 0;
    context.rotate(walkAngle + jumpAngle);

    context.drawImage(AssetManager.getImage('character/leg'), -5, 0);

    context.restore();
  }

  _renderLeftArm(context, reverse) {
    context.save();

    context.translate(15, 28);

    // Apply walk cycle + jump pose
    const walkAngle = this._arm.angle;
    // In air: both arms go back (same direction based on facing)
    const directionMultiplier = reverse ? -1 : 1;
    const jumpAngle = this._airState !== AirState.GROUNDED ? this._jumpArmAngle * directionMultiplier : 0;
    context.rotate(walkAngle + jumpAngle);

    context.drawImage(AssetManager.getImage('character/arm'), -5, -4);

    context.restore();
  }

  _renderRightLeg(context, reverse) {
    context.save();

    context.translate(15, 42);

    // Apply walk cycle + jump pose
    const walkAngle = this._leg.angle;
    // In air: both legs trail back (same direction based on facing)
    const directionMultiplier = reverse ? -1 : 1;
    const jumpAngle = this._airState !== AirState.GROUNDED ? this._jumpLegAngle * directionMultiplier : 0;
    context.rotate(walkAngle + jumpAngle);

    context.drawImage(AssetManager.getImage('character/leg'), -5, 0);

    context.restore();
  }

  _renderBody(context, reverse) {
    context.save();

    context.translate(15, 20);
    context.rotate(this._body.angle);

    context.drawImage(AssetManager.getImage('character/body'), -10, 6);

    if (reverse) {
      context.scale(-1, 1);
    }

    context.drawImage(AssetManager.getImage('props/rabbit-tail'), -16, 16);

    context.restore();
  }

  _renderHead(context, reverse) {
    context.save();

    context.translate(15, 13);

    // Apply walk cycle + jump pose (same as arms/legs)
    const walkAngle = this._head.angle;
    const directionMultiplier = reverse ? -1 : 1;
    const jumpAngle = this._airState !== AirState.GROUNDED ? this._jumpHeadAngle * directionMultiplier : 0;
    context.rotate(walkAngle + jumpAngle);

    context.drawImage(AssetManager.getImage('character/head'), -14, -12);

    if (reverse) {
      context.scale(-1, 1);
    }

    // Eye
    context.drawImage(AssetManager.getImage('character/eye'), 0, -4);

    // Hair
    context.drawImage(AssetManager.getImage('character/hair'), -4, -16);

    context.restore();
  }

  _renderRightArm(context, reverse) {
    context.save();

    context.translate(15, 28);

    // Apply walk cycle + jump pose
    const walkAngle = -this._arm.angle;
    // In air: both arms go back (same direction based on facing)
    const directionMultiplier = reverse ? -1 : 1;
    const jumpAngle = this._airState !== AirState.GROUNDED ? this._jumpArmAngle * directionMultiplier : 0;
    context.rotate(walkAngle + jumpAngle);

    context.drawImage(AssetManager.getImage('character/arm'), -5, -4);

    if (reverse) {
      context.scale(-1, 1);
    }

    context.drawImage(AssetManager.getImage('props/lollipop'), 5, 8);

    context.restore();
  }
}
