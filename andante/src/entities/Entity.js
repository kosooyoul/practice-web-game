/**
 * Entity - Base class for all game entities
 */
import { PhysicsBody } from '../physics/PhysicsBody.js';

export class Entity {
  _body = null;
  _isStatic = false;

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {Object} options
   */
  constructor(x, y, width, height, options = {}) {
    this._body = new PhysicsBody(x, y, width, height, options.physics);
    this._isStatic = options.isStatic ?? false;
  }

  get body() {
    return this._body;
  }

  get x() {
    return this._body.x;
  }

  get y() {
    return this._body.y;
  }

  get width() {
    return this._body.width;
  }

  get height() {
    return this._body.height;
  }

  get isStatic() {
    return this._isStatic;
  }

  /**
   * Update entity (called every frame)
   * @param {Object} status - Game status
   */
  update(status) {
    // Override in subclasses
  }

  /**
   * Render entity
   * @param {CanvasRenderingContext2D} context
   * @param {Object} status - Game status
   */
  render(context, status) {
    // Override in subclasses
  }
}
