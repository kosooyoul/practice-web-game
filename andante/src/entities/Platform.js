/**
 * Platform - Static platform/obstacle entity
 */
import { Entity } from './Entity.js';

export class Platform extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   */
  constructor(x, y, width, height) {
    super(x, y, width, height, { isStatic: true });
  }

  /**
   * Render platform
   * @param {CanvasRenderingContext2D} context
   * @param {Object} _status
   */
  render(context, _status) {
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.strokeRect(this.x, this.y - this.height, this.width, this.height);
  }
}
