/**
 * Player - Player character entity
 */
import { Entity } from './Entity.js';
import { PLAYER } from '../config/constants.js';

export class Player extends Entity {
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
  }

  /**
   * Render player
   * @param {CanvasRenderingContext2D} context
   * @param {Object} _status
   */
  render(context, _status) {
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.strokeRect(this.x, this.y - this.height, this.width, this.height);
  }
}
