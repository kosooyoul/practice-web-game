/**
 * Joypad - Touch/Mouse joystick and action buttons input handler
 * 
 * Layout:
 * - Left side: D-pad joystick for movement
 * - Right side: A button (jump) and B button (interact)
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
  _actionedCursor = null;    // A button (action/jump)
  _interactedCursor = null;  // B button (interact)

  _status = {};

  // Button positions (calculated in setCanvasSize)
  _buttonA = { x: 0, y: 0, radius: 35 };  // Jump button (lower)
  _buttonB = { x: 0, y: 0, radius: 30 };  // Interact button (upper)

  // B button visibility (shown only when near trigger)
  _showInteractButton = false;

  constructor() {}

  /**
   * Set whether to show the interact (B) button
   * @param {boolean} show
   */
  setShowInteractButton(show) {
    this._showInteractButton = show;
  }

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

    // Calculate button positions (right side, gamepad style)
    // A button (jump) - lower right
    this._buttonA.x = this._scaledHalfWidth - 80;
    this._buttonA.y = this._scaledHalfHeight - 100;
    this._buttonA.radius = 35;

    // B button (interact) - upper right, smaller
    this._buttonB.x = this._scaledHalfWidth - 140;
    this._buttonB.y = this._scaledHalfHeight - 160;
    this._buttonB.radius = 28;
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
        // Right side -> check which button
        const distToA = Math.hypot(cursorX - this._buttonA.x, cursorY - this._buttonA.y);
        const distToB = Math.hypot(cursorX - this._buttonB.x, cursorY - this._buttonB.y);

        // Check B button first (interact) - smaller, higher priority
        if (distToB < this._buttonB.radius + 20 && this._interactedCursor === null) {
          this._interactedCursor = { x: cursorX, y: cursorY, id: pointer.id };
          this._status['interact'] = Date.now();
        }
        // Check A button (action/jump)
        else if (distToA < this._buttonA.radius + 20 && this._actionedCursor === null) {
          this._actionedCursor = { x: cursorX, y: cursorY, id: pointer.id };
          this._status['action'] = Date.now();
        }
        // Fallback: anywhere on right side = jump
        else if (this._actionedCursor === null) {
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

    if (this._interactedCursor) {
      const interactedPointer = pointers.find((pointer) => pointer.id === this._interactedCursor.id);
      if (interactedPointer === undefined || interactedPointer.id === undefined) {
        delete this._status['interact'];
        this._interactedCursor = null;
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
    // Render joystick (left side)
    if (this._downedCursor) {
      this._renderJoystickDirection(context, 'left', !!this._status['left']);
      this._renderJoystickDirection(context, 'right', !!this._status['right']);
      this._renderJoystickDirection(context, 'up', !!this._status['up']);
      this._renderJoystickDirection(context, 'down', !!this._status['down']);
    }

    if (this._movingCursor) {
      this._renderJoystickCursor(context);
    }

    // Always render action buttons (right side, gamepad style)
    this._renderActionButtons(context);
  }

  /**
   * Render A and B action buttons (gamepad style)
   * @param {CanvasRenderingContext2D} context
   */
  _renderActionButtons(context) {
    // A button (Jump) - always visible
    const aPressed = !!this._status['action'];
    this._renderButton(
      context,
      this._buttonA.x,
      this._buttonA.y,
      this._buttonA.radius,
      'A',
      aPressed,
      { base: '#3080E0', pressed: '#60A0FF', label: 'Jump' }
    );

    // B button (Interact) - only shown when near trigger zone
    if (this._showInteractButton) {
      const bPressed = !!this._status['interact'];
      this._renderButton(
        context,
        this._buttonB.x,
        this._buttonB.y,
        this._buttonB.radius,
        'B',
        bPressed,
        { base: '#30A030', pressed: '#60C060', label: 'Use' }
      );
    }
  }

  /**
   * Render a single gamepad-style button
   * @param {CanvasRenderingContext2D} context
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {string} letter
   * @param {boolean} pressed
   * @param {Object} colors
   */
  _renderButton(context, x, y, radius, letter, pressed, colors) {
    context.save();

    // Button shadow
    context.beginPath();
    context.arc(x, y + 3, radius, 0, Math.PI * 2);
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fill();

    // Button base (outer ring)
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = pressed ? colors.pressed : colors.base;
    context.globalAlpha = pressed ? 0.9 : 0.5;
    context.fill();

    // Inner circle
    context.beginPath();
    context.arc(x, y, radius - 6, 0, Math.PI * 2);
    context.fillStyle = pressed ? colors.pressed : colors.base;
    context.globalAlpha = pressed ? 0.7 : 0.3;
    context.fill();

    // Border
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.strokeStyle = pressed ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
    context.lineWidth = 2;
    context.globalAlpha = 1;
    context.stroke();

    // Letter
    context.font = `bold ${radius * 0.8}px sans-serif`;
    context.fillStyle = pressed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(letter, x, y);

    // Label below button
    context.font = '10px sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fillText(colors.label, x, y + radius + 12);

    context.restore();
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
