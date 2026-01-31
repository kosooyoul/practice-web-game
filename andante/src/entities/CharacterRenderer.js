/**
 * CharacterRenderer - Renders animated character with body parts
 * Handles walking animation, direction, and SVG asset rendering
 */
import { PendulumMotion } from '../animation/PendulumMotion.js';
import { AssetManager } from '../assets/AssetManager.js';

export class CharacterRenderer {
  _direction = 'right';
  _isMoving = false;

  // Pendulum motions for each body part
  _head = null;
  _body = null;
  _arm = null;
  _leg = null;

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
   * Update animation state based on input
   * @param {Object} input - Input state {left, right, up, action}
   */
  update(input) {
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

    // Update pendulum animations
    const reverse = this._direction === 'left';
    this._head.compute(this._isMoving, reverse);
    this._body.compute(this._isMoving, reverse);
    this._arm.compute(this._isMoving, reverse);
    this._leg.compute(this._isMoving, reverse);
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

  // --- Private render methods ---

  _renderCollisionBox(context, width, height) {
    context.strokeStyle = 'red';
    context.strokeRect(0, 0, width, height);
  }

  _renderLeftLeg(context, reverse) {
    context.save();

    context.translate(15, 42);
    context.rotate(-this._leg.angle);

    context.drawImage(AssetManager.getImage('character/leg'), -5, 0);

    context.restore();
  }

  _renderLeftArm(context, reverse) {
    context.save();

    context.translate(15, 28);
    context.rotate(this._arm.angle);

    context.drawImage(AssetManager.getImage('character/arm'), -5, -4);

    context.restore();
  }

  _renderRightLeg(context, reverse) {
    context.save();

    context.translate(15, 42);
    context.rotate(this._leg.angle);

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
    context.rotate(this._head.angle);

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
    context.rotate(-this._arm.angle);

    context.drawImage(AssetManager.getImage('character/arm'), -5, -4);

    if (reverse) {
      context.scale(-1, 1);
    }

    context.drawImage(AssetManager.getImage('props/lollipop'), 5, 8);

    context.restore();
  }
}
