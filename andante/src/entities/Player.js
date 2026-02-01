/**
 * Player - Player character entity with animated character rendering
 */
import { Entity } from './Entity.js';
import { PLAYER } from '../config/constants.js';
import { CharacterRenderer } from './CharacterRenderer.js';

export class Player extends Entity {
  _characterRenderer = null;

  /**
   * @param {number} x - Initial X position (will be set by map spawn)
   * @param {number} y - Initial Y position (will be set by map spawn)
   * @param {number} width
   * @param {number} height
   * @param {Object} options
   */
  constructor(
    x = 0,
    y = 100,
    width = PLAYER.WIDTH,
    height = PLAYER.HEIGHT,
    options = {}
  ) {
    super(x, y, width, height, options);
    this._characterRenderer = new CharacterRenderer();
  }

  /**
   * Update character animation based on input and physics state
   * @param {Object} input - Input state {left, right, up, action}
   */
  updateAnimation(input) {
    const velocityY = this._body.physics.accelerationY;
    // In air if: jumped OR actually falling (threshold to avoid ground fluctuation)
    const fallingThreshold = -3;
    const isInAir = this._body.isInAir || velocityY < fallingThreshold;
    this._characterRenderer.update(input, isInAir, velocityY);
  }

  /**
   * Get character renderer for direct access
   * @returns {CharacterRenderer}
   */
  get characterRenderer() {
    return this._characterRenderer;
  }

  /**
   * Get current facing direction
   * @returns {string} 'left' or 'right'
   */
  get direction() {
    return this._characterRenderer.direction;
  }

  /**
   * Render player with animated character
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status - includes interpolation
   */
  render(context, status) {
    // Use interpolated position for smooth rendering at high FPS
    const alpha = status?.interpolation ?? 1;
    const { x, y } = this.getInterpolatedPosition(alpha);
    this._characterRenderer.render(context, x, y, this.width, this.height);

    // Render flap gauge below player
    this._renderFlapGauge(context, x, y);
  }

  /**
   * Render flap/jump gauge below player
   * @param {CanvasRenderingContext2D} context
   * @param {number} x - Player X position
   * @param {number} y - Player Y position (bottom)
   */
  _renderFlapGauge(context, x, y) {
    const physics = this._body.physics;
    const maxFlaps = physics.flappable;
    const usedFlaps = physics.flapped;
    const remainingFlaps = maxFlaps - usedFlaps;

    // Gauge config
    const gaugeWidth = this.width + 10;
    const gaugeHeight = 4;
    const gaugePadding = 8;
    const gaugeX = x + this.width / 2 - gaugeWidth / 2;
    const gaugeY = y + gaugePadding;

    // Background bar
    context.fillStyle = 'rgba(0, 0, 0, 0.4)';
    context.beginPath();
    context.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 2);
    context.fill();

    // Filled portion (remaining flaps)
    const fillRatio = remainingFlaps / maxFlaps;
    const fillWidth = gaugeWidth * fillRatio;

    if (fillWidth > 0) {
      // Color based on remaining flaps
      let fillColor;
      if (fillRatio > 0.5) {
        fillColor = 'rgba(100, 200, 100, 0.9)'; // Green
      } else if (fillRatio > 0.2) {
        fillColor = 'rgba(230, 180, 80, 0.9)'; // Yellow/Orange
      } else {
        fillColor = 'rgba(220, 80, 80, 0.9)'; // Red
      }

      context.fillStyle = fillColor;
      context.beginPath();
      context.roundRect(gaugeX, gaugeY, fillWidth, gaugeHeight, 2);
      context.fill();
    }

    // Border
    context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    context.lineWidth = 0.5;
    context.beginPath();
    context.roundRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 2);
    context.stroke();
  }
}
