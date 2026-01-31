/**
 * Player - Player character entity
 */
import { Entity } from './Entity.js';
import { PLAYER } from '../config/constants.js';

export class Player extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {Object} options
   */
  constructor(
    x = PLAYER.START_X,
    y = PLAYER.START_Y,
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
