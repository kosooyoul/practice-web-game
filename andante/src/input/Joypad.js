/**
 * Joypad - Touch/Mouse joystick and action button input handler
 */
import { KEY_NAMES } from '../config/constants.js';

export class Joypad {
  _width = 0;
  _height = 0;
  _scale = 1;
  _scaledHalfWidth = 0;
  _scaledHalfHeight = 0;

  _downedCursor = null;
  _movingCursor = null;
  _actionedCursor = null;

  _status = {};

  constructor() {}

  /**
   * Get current joypad status
   * @returns {Object} Current input status
   */
  getStatus() {
    return this._status;
  }

  /**
   * Update canvas size for coordinate calculation
   * @param {number} width
   * @param {number} height
   * @param {number} scale
   */
  setCanvasSize(width, height, scale) {
    this._width = width;
    this._height = height;
    this._scale = scale || 1;
    this._scaledHalfWidth = width / 2 / this._scale;
    this._scaledHalfHeight = height / 2 / this._scale;
  }

  /**
   * Handle pointer down events
   * @param {Array} pointers - Array of pointer objects with x, y, id
   */
  handlePointersDown(pointers) {
    pointers.forEach((pointer) => {
      const cursorX = pointer.x - this._scaledHalfWidth;
      const cursorY = pointer.y - this._scaledHalfHeight;

      if (cursorX < 0) {
        // Left side -> joystick
        if (this._downedCursor === null) {
          this._downedCursor = { x: cursorX, y: cursorY, id: pointer.id };
          this._movingCursor = { x: cursorX, y: cursorY, id: pointer.id };
        }
      } else {
        // Right side -> action
        if (this._actionedCursor === null) {
          this._actionedCursor = { x: cursorX, y: cursorY, id: pointer.id };
          this._status['action'] = Date.now();
        }
      }
    });
  }

  /**
   * Handle pointer move events
   * @param {Array} pointers - Array of pointer objects with x, y, id
   */
  handlePointersMove(pointers) {
    if (this._downedCursor === null) {
      return;
    }

    pointers.forEach((pointer) => {
      if (pointer.id !== this._downedCursor.id) {
        return;
      }

      const cursorX = pointer.x - this._scaledHalfWidth;
      const cursorY = pointer.y - this._scaledHalfHeight;
      this._movingCursor = { x: cursorX, y: cursorY };

      const deltaX = this._movingCursor.x - this._downedCursor.x;
      const deltaY = this._movingCursor.y - this._downedCursor.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this._setDirection('right');
        } else if (deltaX < 0) {
          this._setDirection('left');
        }
      } else {
        if (deltaY > 0) {
          this._setDirection('down');
        } else if (deltaY < 0) {
          this._setDirection('up');
        }
      }
    });
  }

  /**
   * Handle pointer up events
   * @param {Array} pointers - Array of pointer objects with x, y, id
   */
  handlePointersUp(pointers) {
    if (this._downedCursor) {
      const downedPointer = pointers.find((pointer) => pointer.id === this._downedCursor.id);
      if (downedPointer === undefined || downedPointer.id === undefined) {
        this._clearDirections();
        this._downedCursor = null;
        this._movingCursor = null;
      }
    }

    if (this._actionedCursor) {
      const actionedPointer = pointers.find((pointer) => pointer.id === this._actionedCursor.id);
      if (actionedPointer === undefined || actionedPointer.id === undefined) {
        delete this._status['action'];
        this._actionedCursor = null;
      }
    }
  }

  /**
   * Handle key down events
   * @param {number} keyCode
   */
  handleKeyDown(keyCode) {
    const keyName = KEY_NAMES[keyCode];
    if (!keyName || this._status[keyName] !== undefined) {
      return;
    }
    this._status[keyName] = Date.now();
  }

  /**
   * Handle key up events
   * @param {number} keyCode
   */
  handleKeyUp(keyCode) {
    const keyName = KEY_NAMES[keyCode];
    if (keyName) {
      delete this._status[keyName];
    }
  }

  /**
   * Compute (called every frame)
   * @param {Object} _status - Game status
   */
  compute(_status) {
    // Reserved for future use (e.g., dead zone handling)
  }

  /**
   * Render joypad UI
   * @param {CanvasRenderingContext2D} context
   * @param {Object} _status - Game status
   */
  render(context, _status) {
    if (this._downedCursor) {
      this._renderJoystickDirection(context, 'left', !!this._status['left']);
      this._renderJoystickDirection(context, 'right', !!this._status['right']);
      this._renderJoystickDirection(context, 'up', !!this._status['up']);
      this._renderJoystickDirection(context, 'down', !!this._status['down']);
    }

    if (this._movingCursor) {
      this._renderJoystickCursor(context);
    }
  }

  /**
   * Set direction and clear others
   * @param {string} direction - 'left', 'right', 'up', 'down'
   */
  _setDirection(direction) {
    if (this._status[direction] !== undefined) {
      return;
    }

    this._status[direction] = Date.now();
    ['left', 'right', 'up', 'down'].forEach((dir) => {
      if (dir !== direction) {
        delete this._status[dir];
      }
    });
  }

  /**
   * Clear all direction inputs
   */
  _clearDirections() {
    delete this._status['left'];
    delete this._status['right'];
    delete this._status['up'];
    delete this._status['down'];
  }

  /**
   * Render joystick direction arc
   * @param {CanvasRenderingContext2D} context
   * @param {string} direction
   * @param {boolean} highlight
   */
  _renderJoystickDirection(context, direction, highlight) {
    const angles = {
      left: { start: Math.PI * 0.75, end: Math.PI * 1.25 },
      right: { start: Math.PI * 1.75, end: Math.PI * 2.25 },
      up: { start: Math.PI * 1.25, end: Math.PI * 1.75 },
      down: { start: Math.PI * 0.25, end: Math.PI * 0.75 },
    };

    const { start, end } = angles[direction];
    const cx = this._downedCursor.x;
    const cy = this._downedCursor.y;
    const innerRadius = 30;
    const outerRadius = 40;

    context.beginPath();
    context.fillStyle = highlight ? 'rgba(127, 0, 127, 0.2)' : 'rgba(127, 127, 127, 0.2)';
    context.strokeStyle = 'rgba(220, 220, 220, 0.4)';

    const startX = cx + Math.cos(start) * innerRadius;
    const startY = cy + Math.sin(start) * innerRadius;
    context.moveTo(startX, startY);
    context.arc(cx, cy, innerRadius, start, end);
    context.arc(cx, cy, outerRadius, end, start, true);
    context.closePath();

    context.fill();
    context.stroke();
  }

  /**
   * Render joystick cursor
   * @param {CanvasRenderingContext2D} context
   */
  _renderJoystickCursor(context) {
    context.beginPath();
    context.fillStyle = 'rgba(127, 127, 127, 0.2)';
    context.strokeStyle = 'rgba(220, 220, 220, 0.4)';
    context.arc(this._movingCursor.x, this._movingCursor.y, 20, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
}
