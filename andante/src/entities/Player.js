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
   * Update character animation based on input
   * @param {Object} input - Input state {left, right, up, action}
   */
  updateAnimation(input) {
    this._characterRenderer.update(input);
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
   * @param {Object} _status
   */
  render(context, _status) {
    this._characterRenderer.render(context, this.x, this.y, this.width, this.height);
  }
}
